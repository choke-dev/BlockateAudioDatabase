export const _maxDuration = 60;

import { ROBLOX_CREDENTIALS } from "$env/static/private";
import { uploadConfig } from "$lib/config/upload";
import { whitelistAssetToUser } from "$lib/server/audioUploader";
import { prisma, supabase } from "$lib/server/db";
import { fileTypeFromBuffer } from "file-type";
import { unlink, writeFileSync } from "fs";
import { AssetsApi } from "openblox/cloud";
import { setConfig } from "openblox/config";
import { join } from "path";
import type { RequestEvent } from "./$types";

const PARSED_ROBLOX_CREDENTIALS: { opencloudAPIKey: string, accountCookie: string, userId: string }[] = JSON.parse(ROBLOX_CREDENTIALS);

async function deleteRequest(requestId: string) {
    const request = await prisma.requests.findUnique({ where: { id: requestId } });
    if (!request) return { success: false, errors: [{ message: 'Request not found', code: 'request_not_found' }] };

    try {
        await Promise.all([
            prisma.requests.delete({ where: { id: request.id } }),
            supabase.storage.from('whitelistrequests').remove([request.filePath])
        ]);
        return { success: true };
    } catch (err) {
        console.error('Error deleting request', err);
        return { success: false, errors: [{ message: 'An error occurred while deleting the request data.', code: 'error_processing_request' }] };
    }
}

function getAvailableBot(): Promise<typeof PARSED_ROBLOX_CREDENTIALS[number]> {
    return new Promise((resolve, reject) => {
        let availableCredentials = [...PARSED_ROBLOX_CREDENTIALS];
        const pickBot = async () => {
            if (availableCredentials.length === 0) {
                return reject(new Error('No available bots can handle the upload at this time. Please try again later.'));
            }
            const randomIndex = Math.floor(Math.random() * availableCredentials.length);
            const choosenCredential = availableCredentials[randomIndex];
            const response = await fetch(`https://publish.roblox.com/v1/asset-quotas?resourceType=RateLimitUpload&assetType=Audio`, {
                headers: { 'Cookie': `.ROBLOSECURITY=${choosenCredential.accountCookie}` }
            });
            const data = await response.json();
            if (data.errors?.[0].message === "User is moderated") {
                console.warn(`[ ! ] Bot ${choosenCredential.userId} has a moderation action. Picking another bot...`);
                availableCredentials.splice(randomIndex, 1);
                return pickBot();
            }
            console.log(`Bot ${choosenCredential.userId} has ${data.quotas[0].capacity - data.quotas[0].usage}/${data.quotas[0].capacity} audio uploads remaining`);
            if (data.quotas[0].usage < data.quotas[0].capacity) return resolve(choosenCredential);
            availableCredentials.splice(randomIndex, 1);
            return pickBot();
        }
        pickBot();
    });
}

async function acceptRequest(event: RequestEvent) {
    const requestId = event.params.requestId;
    const request = await prisma.requests.findUnique({ where: { id: requestId } });
    if (!request) return new Response(JSON.stringify({ success: false, errors: [{ message: 'Request not found', code: 'request_not_found' }] }), { status: 404 });

    let choosenCredential;
    try {
        choosenCredential = await getAvailableBot();
    } catch (err) {
        choosenCredential = null;
    }

    if (!choosenCredential) return new Response(JSON.stringify({ success: false, errors: [{ message: 'No bots are available to handle this request', code: 'no_bots_available' }] }), { status: 503 });

    setConfig({ cloudKey: choosenCredential.opencloudAPIKey });

    const audioRegexMatch = request.fileName.match(uploadConfig.fileNameRegex);
    if (!audioRegexMatch) {
        return new Response(JSON.stringify({ success: false, errors: [{ message: 'Invalid file name', code: 'invalid_file_name' }] }), { status: 400 });
    }

    const [audioCategory, audioName] = [audioRegexMatch[1].slice(0, 1000), audioRegexMatch[2].slice(0, 50)];
    const { data: fileData, error } = await supabase.storage.from('whitelistrequests').download(request.filePath);
    if (error) return new Response(JSON.stringify({ success: false, errors: [{ message: error.message, code: 'unknown_error' }] }), { status: 500 });

    const buffer = await fileData.bytes();
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType) return new Response(JSON.stringify({ success: false, errors: [{ message: 'Unable to detect MIME type', code: 'file_type_detection_failed' }] }), { status: 400 });

    const tempFilePath = join(uploadConfig.directories.temp, request.fileName);
    writeFileSync(tempFilePath, Uint8Array.from(buffer), "binary");

    try {
        const asset = await AssetsApi.createAsset({
            assetType: 'Audio',
            displayName: uploadConfig.audioDisplayName.replace("{audioName}", audioName).replace("{audioCategory}", audioCategory),
            description: uploadConfig.descriptionTemplate.replace("{audioName}", audioName).replace("{audioCategory}", audioCategory),
            file: tempFilePath,
            //@ts-ignore: we already check if the file type is valid before the user can upload it
            fileName: request.fileName,
            userId: Number(choosenCredential.userId)
        });

        if (asset.response.success) {
            //@ts-ignore: asset.response.body.response.assetId exists if asset.response.success is true
            const assetId = asset.response.body.response.assetId;
            const whitelistResponse = await whitelistAssetToUser(choosenCredential, assetId);

            await prisma.uploadedAudio.create({
                data: { 
                    id: assetId, 
                    name: audioName,
                    category: audioCategory,
                    grantedUsePermissions: whitelistResponse.success,
                    requesterUserId: request.userId,
                    uploaderUserId: choosenCredential.userId
                }
            });
            unlink(tempFilePath, err => {
                if (err) console.error("Error deleting file", err);
            });
        }
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ success: false, errors: [{ code: 'unknown_error' }] }), { status: 500 });
    }

    await deleteRequest(requestId);
    return new Response(JSON.stringify({ success: true }));
}

async function rejectRequest(event: RequestEvent) {
    const requestId = event.params.requestId;
    const deleteResponse = await deleteRequest(requestId);
    if (!deleteResponse.success) {
        return new Response(JSON.stringify(deleteResponse), { status: 500 });
    }
    return new Response(JSON.stringify({ success: true }));
}

export const POST = async (event: RequestEvent) => {
    const { action } = await event.request.json();
    switch (action) {
        case 'accept': return acceptRequest(event);
        case 'reject': return rejectRequest(event);
        default: return new Response(JSON.stringify({ success: false, errors: [{ message: 'Invalid action', code: 'invalid_action' }] }), { status: 400 });
    }
}