import type { Handle } from '@sveltejs/kit';
import { _limiter } from './routes/api/audio/search/+server.js';

/**
 * SvelteKit hooks handle function with rate limiting
 */
export const handle: Handle = async ({ event, resolve }) => {
  // Apply rate limiting
  await _limiter.cookieLimiter?.preflight(event);
  
  // Continue with the request
  return resolve(event);
};