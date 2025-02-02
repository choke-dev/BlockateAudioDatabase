import { createAuthorizationURL } from "$lib/server/oauth";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
export const load: PageServerLoad = async ({ request, locals }) => {
    
    if (locals.user) {
        throw redirect(302, '/dashboard');
    }

};