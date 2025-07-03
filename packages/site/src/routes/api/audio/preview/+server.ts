import { AUDIO_FILE_PROXY_AUTH } from '$env/static/private';
import { prisma } from '$lib/server/db.js';
import { checkAudioUrls, getAudios, uploadAudio } from '$lib/server/jukehostapi.js';
import { AudioPreviewAPISchema } from '$lib/zodSchemas.js';
import { RetryAfterRateLimiter } from 'sveltekit-rate-limiter/server';

export const _limiter = new RetryAfterRateLimiter({
    IP: [6, 's']
});

export const POST = async (event) => {
    const status = await _limiter.check(event);
    if (status.limited) {
        return new Response(JSON.stringify({
            errors: [ { message: `You are being rate limited. Please try again after ${status.retryAfter} second${Math.abs(status.retryAfter) === 1 ? '' : 's'}.` } ] }),
            {
                status: 429,
                headers: {
                    "Retry-After": String(status.retryAfter)
                }
            }
        )
    }

    const requestBody = await event.request.json().catch(() => null);
    if (!requestBody) {
        return new Response(JSON.stringify({ errors: [{ message: `Invalid JSON data provided in request body` }] }), { status: 400 })
    }

    const requestJson = AudioPreviewAPISchema.safeParse(requestBody);
    if (!requestJson.success) return new Response(JSON.stringify({ errors: requestJson.error.issues }), { status: 400 });

    const audioIds = requestJson.data;
    const audios = await prisma.audio.findMany({
        where: {
            id: {
                in: audioIds
            },
            private: false
        }
    })
    const missingIds = audioIds.filter(id => !audios.some(audio => audio.id === id));

    if (missingIds.length === audioIds.length) {
        return new Response(
            JSON.stringify({ errors: [{ message: `None of the provided audio IDs exist.`, missingIds }] }),
            { status: 400 }
        );
    }

    if (missingIds.length > 0) {
        return new Response(
            JSON.stringify({ errors: [{ message: `Some of the provided audio IDs do not exist.`, missingIds }] }),
            { status: 400 }
        );
    }



    const audioUrlDict: Record<string, string> = {};
    const audioIdsToFetch: number[] = [];
    const audioUrlsToCheck: { id: string; url: string }[] = [];

    // First check if audioUrl exists in the database
    for (const audio of audios) {
        // If audioUrl exists in the database, add it to check list
        if (audio.audioUrl) {
            audioUrlsToCheck.push({ id: audio.id, url: audio.audioUrl });
        } else {
            audioIdsToFetch.push(Number(audio.id));
        }
    }

    // Check if existing audio URLs are still valid
    if (audioUrlsToCheck.length > 0) {
        const urls = audioUrlsToCheck.map(item => item.url);
        const validityResults = await checkAudioUrls(urls, 5); // Limit to 5 concurrent requests
        
        for (const { id, url } of audioUrlsToCheck) {
            if (validityResults[url]) {
                // URL is valid, use it directly
                audioUrlDict[id] = url;
            } else {
                // URL is invalid (404), need to fetch and reupload
                console.log(`Audio URL for ID ${id} is invalid, will fetch and reupload`);
                audioIdsToFetch.push(Number(id));
            }
        }
    }

    // If we have audios to fetch from the proxy
    if (audioIdsToFetch.length > 0) {
        // Fetch audio URLs from the proxy in the main flow
        const audioUrlsResponse = await fetch('http://109.106.244.58:3789/audio/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: AUDIO_FILE_PROXY_AUTH
            },
            body: JSON.stringify(audioIdsToFetch)
        });

        if (!audioUrlsResponse.ok) {
            console.error(await audioUrlsResponse.text());
            return new Response(
                JSON.stringify({ errors: [{ message: `An unexpected error occurred.` }] }),
                { status: 500 }
            );
        }

        const audioUrls = await audioUrlsResponse.json();

        // Add the proxy URLs to the response dictionary
        for (let i = 0; i < audioUrls.length; i++) {
            if (typeof audioUrls[i] !== 'string') {
                console.error(`Invalid audio URL received from proxy: ${audioUrls[i]}`);
                continue;
            }
            audioUrlDict[audioIdsToFetch[i]] = audioUrls[i];
        }
        
        // Start the background process for uploading to JukeHost and updating the database
        // Use Promise.all to better handle concurrent uploads and ensure completion
        (async () => {
            try {
                console.log(`Starting background process for ${audioUrls.length} audio files`);
                
                // Upload the fetched audio URLs to JukeHost with better concurrency handling
                const uploadPromises = audioUrls.map(async (audioUrl: string, i: number) => {
                    try {
                        const audioId: number = audioIdsToFetch[i];
                        console.log(`Fetching audio for ID: ${audioId}`);
                        const response = await fetch(audioUrl);
                        const audioBlob = await response.blob();
                        
                        // Pass both the blob and the filename (audio ID)
                        const uploadSuccess = await uploadAudio(audioBlob, `${audioId}.ogg`);
                        if (!uploadSuccess) {
                            console.error(`Failed to upload audio for ID: ${audioId}`);
                            return { success: false, audioId };
                        }
                        return { success: true, audioId };
                    } catch (error) {
                        console.error(`Error processing audio at index ${i}:`, error);
                        return { success: false, audioId: audioIdsToFetch[i], error: String(error) };
                    }
                });
                
                // Wait for all uploads to complete
                const uploadResults = await Promise.all(uploadPromises);
                const successfulUploads = uploadResults.filter((result: { success: boolean, audioId: number, error?: string }) => result.success);
                
                if (successfulUploads.length === 0) {
                    console.log("No successful uploads to process");
                    return;
                }
                
                console.log(`${successfulUploads.length}/${audioUrls.length} uploads completed successfully`);
                console.log("Starting database update");
                
                // Refresh JukeHost tracks to get the newly uploaded ones
                try {
                    const refreshedTracks = await getAudios();
                    
                    // Create a new map with the updated tracks
                    const refreshedMap = new Map();
                    for (const track of refreshedTracks) {
                        const match = track.name.match(/^(\d+)\./);
                        if (match && match[1]) {
                            refreshedMap.set(match[1], track.id);
                        }
                    }

                    // Update database with the new JukeHost URLs
                    const updatePromises = successfulUploads.map(async ({ audioId }: { audioId: number }) => {
                        const jukeHostId = refreshedMap.get(String(audioId));
                        console.log(`AudioId: ${audioId}, JukeHostId: ${jukeHostId}`);
                        
                        if (!jukeHostId) {
                            console.log(`No JukeHost ID found for audio ${audioId}`);
                            return false;
                        }
                        
                        const audioUrl = `https://audio.jukehost.co.uk/${jukeHostId}`;
                        
                        // Update the database with the JukeHost URL
                        try {
                            // Ensure audioId is properly converted to string as per schema
                            const stringAudioId = String(audioId);
                            await prisma.audio.update({
                                where: { id: stringAudioId },
                                data: { audioUrl }
                            });
                            console.log(`Updated audio ${stringAudioId} in database with URL: ${audioUrl}`);
                            return true;
                        } catch (error) {
                            console.error(`Error updating audio ${audioId} in database:`, error);
                            return false;
                        }
                    });
                    
                    // Wait for all database updates to complete
                    const updateResults = await Promise.all(updatePromises);
                    const successfulUpdates = updateResults.filter(result => result);
                    
                    console.log(`Database update complete: ${successfulUpdates.length}/${successfulUploads.length} records updated`);
                } catch (error) {
                    console.error("Error refreshing JukeHost tracks:", error);
                }
            } catch (error) {
                console.error("Error in background audio processing:", error);
            }
        })().catch(error => {
            console.error("Unhandled error in background audio processing:", error);
        });
    }

    // Return all available URLs (both from JukeHost and proxy)
    return new Response(JSON.stringify(audioUrlDict), { status: 200 });
}