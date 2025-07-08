import type { RequestEvent } from '@sveltejs/kit';
import { getAuthenticatedUser, type AuthenticatedUser } from './auth.js';

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(event: RequestEvent): Promise<boolean> {
  const user = await getAuthenticatedUser(event);
  return !!user;
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
 * Decorator function to require authentication for a route handler
 */
export function withAuth<T extends (event: RequestEvent) => Promise<Response>>(handler: T): T {
  return (async (event: RequestEvent) => {
    try {
      await requireAuth(event);
      return await handler(event);
    } catch (error) {
      return new Response(JSON.stringify({
        errors: [{ message: 'Authentication required' }]
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }) as T;
}