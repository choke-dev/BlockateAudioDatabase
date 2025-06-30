import { prisma } from '$lib/server/db.js'


export const GET = async ({ params }) => {
    const audioId = params.audioId;
    
    const audio = await prisma.audio.findUnique({
        where: { id: audioId },
        select: {
            id: true,
            name: true,
            category: true,
            created_at: true
        }
    })

    if (!audio) {
        return new Response(JSON.stringify({ errors: [{ message: 'Audio not found' }] }), { status: 404 })
    } else {
        return new Response(JSON.stringify(audio), { status: 200 })
    }
}