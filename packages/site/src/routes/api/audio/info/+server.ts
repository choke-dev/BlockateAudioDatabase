import { prisma } from '$lib/server/db.js'
import type { RequestHandler } from './$types.js'

const infoHandler: RequestHandler = async (event) => {
    const { url } = event;
    const IDs = url.searchParams.get('id');
    
    if (!IDs) {
        return new Response(JSON.stringify({ errors: [{ message: 'Missing "id" query parameter' }] }), { status: 400 })
    }

    const audioIds = IDs.split(',').map((id: string) => id.trim());

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
    const audios = audioIds.map((id: string) => audioMap.get(id) || null);

    // Check if all entries are null (all IDs were not found)
    const allNull = audios.every((audio: any) => audio === null);
    
    if (allNull) {
        return new Response(JSON.stringify({ errors: [{ message: 'Audio not found' }] }), { status: 404 })
    }

    return new Response(JSON.stringify(audios), { status: 200 })
}

// Export the handler directly (permission checking now handled in hooks.server.ts)
export const GET = infoHandler;
