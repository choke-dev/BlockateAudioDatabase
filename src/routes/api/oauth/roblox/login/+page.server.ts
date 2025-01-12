// import { createAuthorizationURL } from "$lib/server/oauth";
// import { error, redirect } from "@sveltejs/kit";
// import type { PageServerLoad } from "./$types";

// export const load: PageServerLoad = async ({ request }) => {
//     const { success, data } = await createAuthorizationURL('/dashboard');
//     if (!success) throw error(400, "Failed to create authorization URL");

//     throw redirect(302, data as URL);
// };