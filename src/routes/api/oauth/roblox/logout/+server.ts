import { prisma } from "$lib/server/db";

export const POST = async ({ cookies }) => {
    
    const sessionCookie = cookies.get('session')
    if (!sessionCookie) return new Response(JSON.stringify({ success: false, data: null }), { status: 400 });
    const sessionData = sessionCookie.split(':');

    const sessionId = sessionData[0];
    const sessionToken = sessionData[1];
    prisma.session.delete({ where: { id: sessionId } }).catch(null);

    cookies.delete('session', { path: '/' });
    return new Response(JSON.stringify({ success: true, data: "/" }), { status: 200 });
};