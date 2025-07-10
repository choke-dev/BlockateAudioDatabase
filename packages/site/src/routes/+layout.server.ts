import { loadFlash } from 'sveltekit-flash-message/server';
import { VERCEL_GIT_COMMIT_SHA, VERCEL_ENV, VERCEL_DEPLOYMENT_ID } from '$env/static/private';
import { sessionService } from '$lib/server/session.js';

export const load = loadFlash(async (event) => {
    // Get user and permissions from event.locals (set by hooks.server.ts)
    let user = event.locals.user;
    
    // If user exists, get the full user data including createdAt from database
    if (user) {
        try {
            const sessionUser = await sessionService.getUserBySession(event.cookies.get('session') || '');
            if (sessionUser) {
                user = {
                    ...user,
                    createdAt: sessionUser.createdAt.toISOString()
                };
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            // Keep the user from locals even if we can't get createdAt
        }
    }

    return {
        deploymentCommitSHA: VERCEL_GIT_COMMIT_SHA || "DEV",
        deploymentEnvironment: VERCEL_ENV || "development",
        deploymentID: VERCEL_DEPLOYMENT_ID || "N/A",
        user,
        isAuthenticated: event.locals.isAuthenticated
    };
});