import { USER_PERMISSIONS } from "$lib/config";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	return {...locals.user, permissionLevel: USER_PERMISSIONS[locals.user.id] || 0};
};