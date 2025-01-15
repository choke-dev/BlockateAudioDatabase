import { prisma } from "$lib/server/db";
import { AudioSchema } from "$lib/zodSchemas.js";
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params }) => { 
    const { audioId } = params;

    const audio = await prisma.audio.findUniqueOrThrow({ where: { id: audioId } }).catch(error => {
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

    if (audio instanceof Response) return audio;

    return new Response(JSON.stringify({ success: true, data: audio }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 200 });
};

export const PATCH = async ({ request, params }) => {
    const { audioId } = params
    
    let parsedRequest;
    try {
        parsedRequest = JSON.parse( await request.text() );
    } catch (error) {
        return new Response(JSON.stringify({ success: false, data: "Invalid JSON" }), { status: 400 });
    }
    const zodResult = AudioSchema.partial().safeParse(parsedRequest);
    if (!zodResult.success) return new Response(JSON.stringify({ success: false, data: zodResult.error.errors }), { status: 400 });

    const updatedAudio = await prisma.audio.update({
        where: { id: audioId },
        data: {
            name: parsedRequest.name,
            category: parsedRequest.category,
            whitelisterName: parsedRequest.whitelisterName,
            whitelisterUserId: parsedRequest.whitelisterUserId
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
    })

    if (updatedAudio instanceof Response) return updatedAudio;

    return new Response(JSON.stringify({ success: true, data: null }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 200 });
}

export const DELETE: RequestHandler = async ({ params }) => {
    const { audioId } = params;

    const deletedAudio = await prisma.audio.delete({ where: { id: audioId } }).catch (error => {
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

    if (deletedAudio instanceof Response) return deletedAudio;

    return new Response(JSON.stringify(null, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 204 });
}