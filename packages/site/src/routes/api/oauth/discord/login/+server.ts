import type { RequestHandler } from "./$types";
import { createAuthorizationURL } from "$lib/server/oauth";

export const POST: RequestHandler = async ({ url, locals }) => {

    if (locals.user) {
        return new Response(
            JSON.stringify({ success: true, data: "/dashboard" }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    }

    const { success, data } = await createAuthorizationURL('/dashboard');
    if (!success) return new Response(JSON.stringify({ success: false, data: null }), { status: 400 });

    return new Response(
        JSON.stringify({ success: true, data: data as URL }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
};