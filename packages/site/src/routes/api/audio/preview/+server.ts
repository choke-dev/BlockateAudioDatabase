import { prisma } from '$lib/server/db.js';
import { AudioPreviewAPISchema } from '$lib/zodSchemas.js';
import { AUDIO_FILE_PROXY_AUTH } from '$env/static/private';
import { RetryAfterRateLimiter } from 'sveltekit-rate-limiter/server';
import { getAudios, uploadAudio } from '$lib/server/jukehostapi.js';

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

    // Get all audio tracks from JukeHost
    let jukeHostTracks: { id: string; name: string; }[]
    try {
        jukeHostTracks = await getAudios();
    } catch (error) {
        console.error("Error fetching JukeHost tracks:", error);
        jukeHostTracks = [];
    }

    // Create a map of audio names to JukeHost IDs
    const jukeHostMap = new Map();
    for (const track of jukeHostTracks) {
        // Extract the numerical ID from the name (format: ${<numerical integer>}.<file extension>)
        const match = track.name.match(/^(\d+)\./);
        if (match && match[1]) {
            jukeHostMap.set(match[1], track.id);
        }
    }

    const audioUrlDict: Record<string, string> = {};
    const audioIdsToFetch = [];

    // Check which audios exist in JukeHost
    for (const audio of audios) {
        if (!jukeHostMap.has(audio.id)) {
            audioIdsToFetch.push(audio.id);
        }
    }

    // First, populate audioUrlDict with existing JukeHost URLs
    for (const audio of audios) {
        const jukeHostId = jukeHostMap.get(audio.id);
        if (jukeHostId) {
            const audioUrl = `https://audio.jukehost.co.uk/${jukeHostId}`;
            audioUrlDict[audio.id] = audioUrl;
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
            audioUrlDict[audioIdsToFetch[i]] = audioUrls[i];
        }
        
        // Start the background process for uploading to JukeHost and updating the database
        (async () => {
            try {
                // Upload the fetched audio URLs to JukeHost
                for (let i = 0; i < audioUrls.length; i++) {
                    const audioUrl = audioUrls[i];
                    const response = await fetch(audioUrl);
                    const audioBlob = await response.blob();
                    
                    // Pass both the blob and the filename (audio ID)
                    const uploadSuccess = await uploadAudio(audioBlob, `${audioIdsToFetch[i]}.ogg`);
                    if (!uploadSuccess) {
                        console.error(`Failed to upload audio for ID: ${audioIdsToFetch[i]}`);
                        continue;
                    }
                }

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
                    for (const audioId of audioIdsToFetch) {
                        const jukeHostId = refreshedMap.get(audioId);
                        if (jukeHostId) {
                            const audioUrl = `https://audio.jukehost.co.uk/${jukeHostId}`;
                            
                            // Update the database with the JukeHost URL
                            try {
                                await prisma.audio.update({
                                    where: { id: audioId },
                                    data: { audioUrl }
                                });
                                console.log(`Updated audio ${audioId} in database with URL: ${audioUrl}`);
                            } catch (error) {
                                console.error(`Error updating audio ${audioId} in database:`, error);
                            }
                        }
                    }
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