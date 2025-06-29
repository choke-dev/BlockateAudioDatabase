import { loadFlash } from 'sveltekit-flash-message/server';
import { _limiter } from './api/audio/search/+server';
import { VERCEL_GIT_COMMIT_SHA } from '$env/static/private';

export const load = loadFlash(async (event) => {
    await _limiter.cookieLimiter?.preflight(event);

    return {
        deploymentCommitSHA: VERCEL_GIT_COMMIT_SHA || "0000000",
    };
});