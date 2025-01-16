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
	const userId = event.locals?.user?.id;
	const route = event.url.pathname;

	if (Object.keys(ROUTE_PERMISSIONS).some((key) => route.startsWith(key))) {

		if (!userId) {
			throw error(401, 'You must be logged in to access this page.');
		}

		const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([key, value]) => route.startsWith(key))?.[1] || 0;
		const userPermission = USER_PERMISSIONS[userId] || 0;

		if (userPermission < requiredPermission) {
			throw error(403, 'You do not have permission to access this page.');
		}
	}

	return resolve(event);
};

export const handle = sequence(handleAuth, handleRoutePermissions);