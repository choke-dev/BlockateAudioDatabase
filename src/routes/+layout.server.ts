import { loadFlash } from 'sveltekit-flash-message/server';
import { limiter } from './+server';

export const load = loadFlash(async (event) => {
    await limiter.cookieLimiter?.preflight(event);
});