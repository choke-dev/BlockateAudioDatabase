import { prisma } from "./db.js";
import { randomBytes } from "crypto";

export interface SessionData {
  id: string;
  userId: string;
  expiresAt: Date;
}

export class SessionService {
  /**
   * Create a new session for a user
   */
  async createSession(userId: string): Promise<string> {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        expiresAt
      }
    });

    return sessionId;
  }

  /**
   * Get session data by session ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await prisma.session.delete({
      where: { id: sessionId }
    }).catch(() => {
      // Ignore errors if session doesn't exist
    });
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId }
    });
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt }
    }).catch(() => {
      // Ignore errors if session doesn't exist
    });
  }

  /**
   * Get user by session ID
   */
  async getUserBySession(sessionId: string) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    return await prisma.user.findUnique({
      where: { id: session.userId }
    });
  }
}

export const sessionService = new SessionService();