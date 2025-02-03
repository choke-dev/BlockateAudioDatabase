import { loadFlash } from 'sveltekit-flash-message/server';
import { _limiter } from './+server';

export const load = loadFlash(async (event) => {
    await _limiter.cookieLimiter?.preflight(event);
});