import { loadFlash } from 'sveltekit-flash-message/server';
import { VERCEL_GIT_COMMIT_SHA, VERCEL_ENV, VERCEL_DEPLOYMENT_ID } from '$env/static/private';
import { getAuthenticatedUser } from '$lib/server/auth.js';

export const load = loadFlash(async (event) => {
    // Get authenticated user directly in layout
    const user = await getAuthenticatedUser(event);
    
    // If user exists, get the full user data including createdAt from database
    let fullUser = null;
    if (user) {
        try {
            const { sessionService } = await import('$lib/server/session.js');
            const sessionUser = await sessionService.getUserBySession(event.cookies.get('session') || '');
            if (sessionUser) {
                fullUser = {
                    id: user.id,
                    robloxId: user.robloxId,
                    username: user.username,
                    avatar: user.avatar,
                    createdAt: sessionUser.createdAt.toISOString()
                };
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            // Fallback to basic user info without createdAt
            fullUser = {
                id: user.id,
                robloxId: user.robloxId,
                username: user.username,
                avatar: user.avatar,
                createdAt: null
            };
        }
    }

    return {
        deploymentCommitSHA: VERCEL_GIT_COMMIT_SHA || "DEV",
        deploymentEnvironment: VERCEL_ENV || "development",
        deploymentID: VERCEL_DEPLOYMENT_ID || "N/A",
        user: fullUser,
        isAuthenticated: !!user
    };
});