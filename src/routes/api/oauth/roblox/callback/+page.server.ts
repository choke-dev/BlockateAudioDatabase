import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { redirect } from 'sveltekit-flash-message/server'
import { validateAuthorizationCode } from "$lib/server/oauth";
import * as argon2 from "argon2";
import { createSessionToken } from "$lib/server/session";
import { ENFORCE_LOGIN_WHITELIST, USER_PERMISSIONS } from "$lib/config";

export const load: PageServerLoad = async (event) => {
    const url = new URL(event.request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const oAuthError = url.searchParams.get("error");
    const oAuthErrorDescription = url.searchParams.get("error_description");

    if (oAuthError && oAuthErrorDescription) throw redirect(302, '/', { type: "error", message: oAuthErrorDescription }, event);
    if (!code || !state) throw error(400, "Missing code or state");
    

    const { success, info } = await validateAuthorizationCode(code, state);
    if (!success || info instanceof Error) throw error(400, (info as Error).message || "Failed to validate authorization code");
    
    if (ENFORCE_LOGIN_WHITELIST) {
        if (!USER_PERMISSIONS[info.userInfo.sub as string]) {
            throw redirect(302, '/', { type: "error", message: "You are not authorized to log in." }, event);
        }
    }

    const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(32)));
    const randomString = randomBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
    const hash = await argon2.hash(randomString);
    const session = await createSessionToken(info.userInfo.sub as string, hash);
    event.cookies.set('session', `${session.id}:${randomString}`, { path: '/', sameSite: 'strict', httpOnly: true });

    if (info.redirectURI) throw redirect(302, info.redirectURI);
    throw redirect(302, '/');
};