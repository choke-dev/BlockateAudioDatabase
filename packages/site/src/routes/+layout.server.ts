import { loadFlash } from 'sveltekit-flash-message/server';
import { _limiter } from './api/audio/search/+server';

//@ts-ignore env var exists at build and run time
import { VERCEL_GIT_COMMIT_SHA } from "$env/dynamic/private";

export const load = loadFlash(async (event) => {
    await _limiter.cookieLimiter?.preflight(event);

    return {
        gitDeploymentSha: VERCEL_GIT_COMMIT_SHA
    }
});