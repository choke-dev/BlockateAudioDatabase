import { ROUTE_PERMISSIONS, USER_PERMISSIONS } from '$lib/config';
import { validateSessionToken } from '$lib/server/session';
import { error, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

export const handleAuth: Handle = async ({ event, resolve }) => {

	const sessionToken = event.cookies.get('session');
	if (!sessionToken) {
		event.locals.user = null;
		return resolve(event);
	}

	const sessionData = sessionToken.split(':');
	const { success, data } = await validateSessionToken(sessionData[0], sessionData[1]);
	if (!success || data instanceof Error) {
		event.locals.user = null;
		event.cookies.delete('session', { path: '/' });
		return resolve(event);
	}

	event.locals.user = data;

	return resolve(event);
}

export const handleRoutePermissions: Handle = async ({ event, resolve }) => {
	const userId = String(event.locals?.user?.id); // Get the user ID from the request context
	const route = event.url.pathname;    // Get the requested route

	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	// Check if the route has a permission requirement
	if (ROUTE_PERMISSIONS[route]) {
		const requiredPermission = ROUTE_PERMISSIONS[route];
		const userPermission = USER_PERMISSIONS[userId] || 0; // Default to 0 if not found

		// Deny access if the user doesn't meet the required permission
		if (userPermission < requiredPermission) {
			throw error(403, 'Forbidden');
		}
	}

	// Proceed with the request
	return resolve(event);
};

export const handle = sequence(handleAuth, handleRoutePermissions);

// import type { Handle } from '@sveltejs/kit';
// import * as auth from '$lib/server/auth.js';

// const handleAuth: Handle = async ({ event, resolve }) => {
// 	const sessionToken = event.cookies.get(auth.sessionCookieName);
// 	if (!sessionToken) {
// 		event.locals.user = null;
// 		event.locals.session = null;
// 		return resolve(event);
// 	}

// 	const { session, user } = await auth.validateSessionToken(sessionToken);
// 	if (session) {
// 		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
// 	} else {
// 		auth.deleteSessionTokenCookie(event);
// 	}

// 	event.locals.user = user;
// 	event.locals.session = session;

// 	return resolve(event);
// };

// export const handle: Handle = handleAuth;
