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

async function acceptRequest(event: RequestEvent) {
    const requestId = event.params.requestId;
    const request = await prisma.requests.findUnique({ where: { id: requestId } });
    if (!request) return new Response(JSON.stringify({ success: false, errors: [{ message: 'Request not found', code: 'request_not_found' }] }), { status: 404 });

    let choosenCredential = PARSED_ROBLOX_CREDENTIALS[Math.floor(Math.random() * PARSED_ROBLOX_CREDENTIALS.length)];
    while (true) {
        const response = await fetch(`https://publish.roblox.com/v1/asset-quotas?resourceType=RateLimitUpload&assetType=Audio`, {
            headers: { 'Cookie': `.ROBLOSECURITY=${choosenCredential.accountCookie}` }
        });
        const data = await response.json();
        console.log(`Chosen credential has usage of ${data.quotas[0].usage} and capacity of ${data.quotas[0].capacity}`);
        if (data.quotas[0].usage < data.quotas[0].capacity) break;
        const otherCredentials = PARSED_ROBLOX_CREDENTIALS.filter(credential => credential !== choosenCredential);
        if (otherCredentials.length === 0) {
            return new Response(JSON.stringify({ success: false, errors: [{ message: 'No available bots can handle the upload at this time. Please try again later.', code: 'no_available_bots' }] }), { status: 503 });
        }
        console.log("Picking another credential...");
        choosenCredential = otherCredentials[Math.floor(Math.random() * otherCredentials.length)];
    }

    setConfig({ cloudKey: choosenCredential.opencloudAPIKey });

    const audioRegexMatch = request.fileName.match(uploadConfig.fileNameRegex);
    if (!audioRegexMatch) {
        return new Response(JSON.stringify({ success: false, errors: [{ message: 'Invalid file name', code: 'invalid_file_name' }] }), { status: 400 });
    }

    const [audioCategory, audioName] = [audioRegexMatch[1], audioRegexMatch[2]];
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
            displayName: audioName,
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
                    grantedUsePermissions: whitelistResponse.success 
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