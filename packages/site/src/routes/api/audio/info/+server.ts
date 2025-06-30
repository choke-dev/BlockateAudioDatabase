import { prisma } from '$lib/server/db.js'


export const GET = async ({ url }) => {
    const IDs = url.searchParams.get('id');
    
    if (!IDs) {
        return new Response(JSON.stringify({ errors: [{ message: 'Missing "id" query parameter' }] }), { status: 400 })
    }

    const audioIds = IDs.split(',').map(id => id.trim());

    const audios = await prisma.audio.findMany({
        where: { id: { in: audioIds } },
        select: {
            id: true,
            name: true,
            category: true,
            created_at: true
        }
    })

    const missingIds = audioIds.filter(id => !audios.some(audio => audio.id === id));

    if (audios.length === 0) {
        return new Response(JSON.stringify({ errors: [{ message: 'Audio not found' }] }), { status: 404 })
    }

    return new Response(JSON.stringify(audios), { status: 200 })
}
