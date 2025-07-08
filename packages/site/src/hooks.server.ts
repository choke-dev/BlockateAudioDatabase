import type { Handle } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth.js';
import { _limiter } from './routes/api/audio/search/+server.js';

/**
 * SvelteKit hooks handle function with simplified authentication checking
 */
export const handle: Handle = async ({ event, resolve }) => {
  // Apply rate limiting
  await _limiter.cookieLimiter?.preflight(event);
  
  // Get authenticated user for all requests
  const user = await getAuthenticatedUser(event);
  
  // Make user available to all routes via event.locals
  event.locals.user = user ? {
    id: user.id,
    robloxId: user.robloxId,
    username: user.username,
    avatar: user.avatar,
    createdAt: null // This will be set by layout if needed
  } : null;
  
  // Set simple authentication status
  event.locals.isAuthenticated = !!user;
  
  // Continue with the request
  return resolve(event);
};