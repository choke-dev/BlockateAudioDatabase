import { prisma } from '$lib/server/db';
import { AudioSchema, BatchDeleteAudioSchema, BatchPatchAudioSchema } from '$lib/zodSchemas.js'

export const POST = async ({ request }) => {
    let parsedRequest;
    try { parsedRequest = JSON.parse( await request.text() ); } catch (error) { return new Response(JSON.stringify({ success: false, data: "Invalid JSON" }), { status: 400 }); }
    
    const zodResult = AudioSchema.array().safeParse(parsedRequest);
    if (!zodResult.success) return new Response(JSON.stringify({ success: false, data: zodResult.error.errors }), { status: 400 });

    const newAudios = await prisma.audio.createMany({ data: parsedRequest }).catch (error => {
        console.log(`Caught batch POST error:`, error);
    })

    return new Response(JSON.stringify({ success: true, data: newAudios }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 200 });
}

export const PATCH = async ({ request }) => {
    let parsedRequest;
    try { parsedRequest = JSON.parse( await request.text() ); } catch (error) { return new Response(JSON.stringify({ success: false, data: "Invalid JSON" }), { status: 400 }); }

    const zodResult = BatchPatchAudioSchema.safeParse(parsedRequest);
    if (!zodResult.success) return new Response(JSON.stringify({ success: false, data: zodResult.error.errors }), { status: 400 });

    const updateOperations = Object.entries(zodResult).map(([id, data]) =>
        prisma.audio.update({
          where: { id },
          data,
        })
    );
  
    const results = await prisma.$transaction(updateOperations).catch(error => {
        console.log(`Caught batch PATCH error:`, error);
        return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: error?.code } ] }), { status: 500 });
    })
    if (results instanceof Response) return results;

    return new Response(JSON.stringify({ success: true, data: null }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 200 });
}

export const DELETE = async ({ request }) => {
    let parsedRequest;
    try { parsedRequest = JSON.parse( await request.text() ); } catch (error) { return new Response(JSON.stringify({ success: false, data: "Invalid JSON" }), { status: 400 }); }

    const zodResult = BatchDeleteAudioSchema.safeParse(parsedRequest);
    if (!zodResult.success) return new Response(JSON.stringify({ success: false, data: zodResult.error.errors }), { status: 400 });

    const deleteOperations = Object.entries(zodResult).map(([id]) => prisma.audio.delete({ where: { id } }));

    const results = await prisma.$transaction(deleteOperations).catch(error => {
        console.log(`Caught batch DELETE error:`, error);
        return new Response(JSON.stringify({ success: false, errors: [ { message: error.message, code: error?.code } ] }), { status: 500 });
    })
    if (results instanceof Response) return results;

    return new Response(JSON.stringify({ success: true, data: null }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)), { status: 200 });
}