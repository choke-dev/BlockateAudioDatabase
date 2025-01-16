import { USER_PERMISSIONS } from "$lib/config";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
    if (locals.user) {
        const replacer = (key: string, value: any) => 
            typeof value === 'bigint' ? value.toString() : value;

        return new Response(
            JSON.stringify({ success: true, data: { ...locals.user, permissionLevel: USER_PERMISSIONS[locals.user.id] || 0 } }, replacer), 
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
        JSON.stringify({ success: false, data: null }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
};
