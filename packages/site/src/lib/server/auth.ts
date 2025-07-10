import { sessionService } from './session.js';
import { robloxOAuth } from './oauth.js';
import type { RequestEvent } from '@sveltejs/kit';

export interface AuthenticatedUser {
  id: string;
  robloxId: string;
  username: string;
  avatar: string | null;
}

/**
 * Get authenticated user from request event
 * Returns null if user is not authenticated or tokens are invalid
 */
export async function getAuthenticatedUser(event: RequestEvent): Promise<AuthenticatedUser | null> {
  const sessionId = event.cookies.get('session');
  
  if (!sessionId) {
    return null;
  }
  
  try {
    const user = await sessionService.getUserBySession(sessionId);
    
    if (!user) {
      // Clear invalid session cookie
      event.cookies.delete('session', { path: '/' });
      return null;
    }
    
    // Check if we have valid OAuth tokens
    const validAccessToken = await robloxOAuth.getValidAccessToken(user.id);
    
    if (!validAccessToken) {
      // User exists but tokens are invalid/expired - clear session to force re-authentication
      event.cookies.delete('session', { path: '/' });
      return null;
    }
    
    return {
      id: user.id,
      robloxId: user.robloxId,
      username: user.username,
      avatar: user.avatar
    };
    
  } catch (error) {
    console.error('Authentication check error:', error);
    // Clear potentially corrupted session
    event.cookies.delete('session', { path: '/' });
    return null;
  }
}

/**
 * Require authentication - throws error if user is not authenticated
 */
export async function requireAuth(event: RequestEvent): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(event);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Get valid access token for authenticated user
 */
export async function getValidAccessToken(event: RequestEvent): Promise<string | null> {
  const user = await getAuthenticatedUser(event);
  
  if (!user) {
    return null;
  }
  
  return await robloxOAuth.getValidAccessToken(user.id);
}

/**
 * Middleware to check if user is authenticated and extend session
 */
export async function authMiddleware(event: RequestEvent): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUser(event);
  
  if (user) {
    const sessionId = event.cookies.get('session');
    if (sessionId) {
      // Extend session for active users
      await sessionService.extendSession(sessionId);
    }
  }
  
  return user;
}