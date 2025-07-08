// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import 'unplugin-icons/types/svelte';

declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				robloxId: string;
				username: string;
				avatar: string | null;
				createdAt: string | null;
			} | null;
			isAuthenticated: boolean;
		}
		interface PageData {
			flash?: { type: 'success' | 'error'; message: string };
		}
	}
}

export {};
