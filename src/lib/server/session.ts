import * as argon2 from "argon2";
import { prisma } from "$lib/server/db";

export async function createSessionToken(userId: string, hash: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error(`User with ID ${userId} does not exist`);
    }
    return await prisma.session.create({
        data: {
            userId,
            hash
        }
    })
}

export async function validateSessionToken(sessionID: string, sessionToken: string) {
    const session = await prisma.session.findFirst({
        where: {
            id: sessionID
        }
    })
    if (!session) return { success: false, data: Error('Invalid session token') };
    const hashedToken = await argon2.verify(session.hash, sessionToken);

    if (!hashedToken) return { success: false, data: Error('Invalid session token') };

    const user = await prisma.user.findUnique({
        where: {
            id: session.userId
        }
    })
    if (!user) return { success: false, data: Error('Invalid session token') };

    return { success: true, data: user };
}