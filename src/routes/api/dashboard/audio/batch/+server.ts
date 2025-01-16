import { prisma } from '$lib/server/db';
import { AudioSchema, BatchDeleteAudioSchema, BatchPatchAudioSchema } from '$lib/zodSchemas.js'
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export const GET = async ({ url }) => {
    const audioIds = url.searchParams.get('ids');
    if (!audioIds) return new Response(JSON.stringify({ success: false, data: "Missing audio ids" }), { status: 400 });
    const audioIdArray = audioIds.split(',');
    if (audioIdArray.length === 0) return new Response(JSON.stringify({ success: false, data: "Missing audio ids" }), { status: 400 });

    const audios = await prisma.audio.findMany({ where: { id: { in: audioIdArray } } }).catch (error => {
        if (error instanceof PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2025':
                    return new Response(JSON.stringify({ success: false, errors: [ { message: 'Audio not found', code: 'audio_not_found' } ] }), { status: 400 });
                default:
                    return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: error.code } ] }), { status: 500 });
            }
        }

        if (error instanceof PrismaClientUnknownRequestError) {
            return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: 'unknown_error' } ] }), { status: 500 });
        }
    })

    if (audios instanceof Response) return audios;

    return new Response(JSON.stringify({ success: true, data: audios }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 200 })        

}

export const POST = async ({ request }) => {
    let parsedRequest;
    try { parsedRequest = JSON.parse( await request.text() ); } catch (error) { return new Response(JSON.stringify({ success: false, data: "Invalid JSON" }), { status: 400 }); }
    
    const zodResult = AudioSchema.array().safeParse(parsedRequest);
    if (!zodResult.success) return new Response(JSON.stringify({ success: false, data: zodResult.error.errors }), { status: 400 });

    //@ts-ignore
    const parsedAudioBatchAdd = parsedRequest.map(audio => ({
        id: parseInt(audio.id, 10).toString(),
        name: audio.name,
        category: audio.category,
        whitelisterName: audio.whitelisterName,
        whitelisterUserId: parseInt(audio.whitelisterUserId, 10).toString()
    }));
    
    const newAudios = await prisma.audio.createMany({ data: parsedAudioBatchAdd }).catch (error => {
        if (error instanceof PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2002':
                    return new Response(JSON.stringify({ success: false, errors: [ { message: 'Audio already exists', code: 'audio_already_exists' } ] }), { status: 400 });
                default:
                    return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: error.code } ] }), { status: 500 });
            }
        }

        if (error instanceof PrismaClientUnknownRequestError) {
            return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: 'unknown_error' } ] }), { status: 500 });
        }

        if (error instanceof PrismaClientValidationError) {
            return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: 'validation_error' } ] }), { status: 500 });
        }
    })

    if (newAudios instanceof Response) return newAudios;

    return new Response(JSON.stringify({ success: true, data: newAudios }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 200 });
}

export const PATCH = async ({ request }) => {
    let parsedRequest;
    try { parsedRequest = JSON.parse( await request.text() ); } catch (error) { return new Response(JSON.stringify({ success: false, data: "Invalid JSON" }), { status: 400 }); }

    const zodResult = AudioSchema.array().safeParse(parsedRequest);
    if (!zodResult.success) return new Response(JSON.stringify({ success: false, data: zodResult.error.errors }), { status: 400 });

    const updateOperations = await prisma.$transaction(zodResult.data.map(audio => prisma.audio.update(
        { 
            where: { 
                id: String(audio.id)
            }, 
            data: {
                name: audio.name,
                category: audio.category,
                whitelisterName: audio.whitelisterName,
                whitelisterUserId: audio.whitelisterUserId
            } 
        })
    )).catch (error => {
        if (error instanceof PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2025':
                    return new Response(JSON.stringify({ success: false, errors: [ { message: 'Audio not found', code: 'audio_not_found' } ] }), { status: 400 });
                default:
                    return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: error.code } ] }), { status: 500 });
            }
        }

        if (error instanceof PrismaClientUnknownRequestError) {
            return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: 'unknown_error' } ] }), { status: 500 });
        }
    })

    if (updateOperations instanceof Response) return updateOperations;

    return new Response(JSON.stringify({ success: true, data: null }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 200 });
}

export const DELETE = async ({ request }) => {
    let parsedRequest;
    try { parsedRequest = JSON.parse( await request.text() ); } catch (error) { return new Response(JSON.stringify({ success: false, data: "Invalid JSON" }), { status: 400 }); }

    const zodResult = BatchDeleteAudioSchema.safeParse(parsedRequest);
    if (!zodResult.success) return new Response(JSON.stringify({ success: false, data: zodResult.error.errors }), { status: 400 });

    const audios = await prisma.audio.findMany({
        where: {
            id: { in: zodResult.data },
        }
    }).catch (error => {
        if (error instanceof PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2025':
                    return new Response(JSON.stringify({ success: false, errors: [ { message: 'Audio not found', code: 'audio_not_found' } ] }), { status: 400 });
                default:
                    return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: error.code } ] }), { status: 500 });
            }
        }

        if (error instanceof PrismaClientUnknownRequestError) {
            return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: 'unknown_error' } ] }), { status: 500 });
        }

        if (error instanceof PrismaClientValidationError) {
            return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: 'validation_error' } ] }), { status: 500 });
        }
    })
    if (audios instanceof Response) return audios;
    if (audios && audios.length === 0) return new Response(JSON.stringify({ success: false, errors: [ { message: 'Audio not found', code: 'audio_not_found' } ] }), { status: 400 });

    const deleteOperations = await prisma.audio.deleteMany({
        where: {
            id: { in: zodResult.data },
        }
    }).catch(error => {
        if (error instanceof PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2025':
                    return new Response(JSON.stringify({ success: false, errors: [ { message: 'Audio not found', code: 'audio_not_found' } ] }), { status: 400 });
                default:
                    return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: error.code } ] }), { status: 500 });
            }
        }

        if (error instanceof PrismaClientUnknownRequestError) {
            return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: 'unknown_error' } ] }), { status: 500 });
        }

        if (error instanceof PrismaClientValidationError) {
            return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: 'validation_error' } ] }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: 'unknown_error' } ] }), { status: 500 });
    })
    if (deleteOperations instanceof Response) return deleteOperations;

    return new Response(null, { status: 204 });
}