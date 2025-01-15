import { prisma } from "$lib/server/db";
import { AudioSchema } from "$lib/zodSchemas.js";
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";

export const POST = async ({ request, url }) => {
    let parsedRequest;
    try {
        parsedRequest = JSON.parse( await request.text() );
    } catch (error) {
        return new Response(JSON.stringify({ success: false, data: "Invalid JSON" }), { status: 400 });
    }
    const zodResult = AudioSchema.safeParse(parsedRequest);
    if (!zodResult.success) return new Response(JSON.stringify({ success: false, data: zodResult.error.errors }), { status: 400 });


    const newAudio = await prisma.audio.create({
        data: {
            id: parsedRequest.id,
            name: parsedRequest.name,
            category: parsedRequest.category,
            whitelisterName: parsedRequest.whitelisterName,
            whitelisterUserId: parsedRequest.whitelisterUserId
        }
    }).catch (error => {
        if (error instanceof PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2002':
                    return new Response(JSON.stringify({ success: false, errors: [ { message: 'Audio already exists', code: 'audio_already_exists' } ] }), { status: 400 });
                default:
                    return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: error.code } ] }), { status: 500 });
            }
        }

        if (error instanceof PrismaClientUnknownRequestError) {
            return new Response(JSON.stringify({ success: false, errors: [ { code: error.name, message: error.message } ] }), { status: 500 });
        }
    })

    if (newAudio instanceof Response) return newAudio;

    return new Response(JSON.stringify({ success: true, data: null }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 200 });
}