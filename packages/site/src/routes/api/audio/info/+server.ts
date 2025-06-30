import { prisma } from '$lib/server/db.js'


export const GET = async ({ url }) => {
    const IDs = url.searchParams.get('id');
    
    if (!IDs) {
        return new Response(JSON.stringify({ errors: [{ message: 'Missing "id" query parameter' }] }), { status: 400 })
    }

    const audioIds = IDs.split(',').map(id => id.trim());

    // Get unique IDs for the database query
    const uniqueAudioIds = [...new Set(audioIds)];

    const audiosFromDb = await prisma.audio.findMany({
        where: { id: { in: uniqueAudioIds } },
        select: {
            id: true,
            name: true,
            category: true,
            created_at: true
        }
    })

    // Create a map for quick lookup
    const audioMap = new Map();
    audiosFromDb.forEach(audio => {
        audioMap.set(audio.id, audio);
    });

    // Reconstruct the response array preserving the original order and duplicates
    const audios = audioIds
        .map(id => audioMap.get(id))
        .filter(audio => audio !== undefined);

    const missingIds = audioIds.filter(id => !audiosFromDb.some(audio => audio.id === id));

    if (audios.length === 0) {
        return new Response(JSON.stringify({ errors: [{ message: 'Audio not found' }] }), { status: 404 })
    }

    return new Response(JSON.stringify(audios), { status: 200 })
}
