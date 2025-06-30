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
    // Set non-existent entries as null instead of filtering them out
    const audios = audioIds.map(id => audioMap.get(id) || null);

    // Check if all entries are null (all IDs were not found)
    const allNull = audios.every(audio => audio === null);
    
    if (allNull) {
        return new Response(JSON.stringify({ errors: [{ message: 'Audio not found' }] }), { status: 404 })
    }

    return new Response(JSON.stringify(audios), { status: 200 })
}
