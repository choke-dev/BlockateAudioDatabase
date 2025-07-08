import { derived } from 'svelte/store';
import { page } from '$app/stores';
import { auth } from './auth.js';

// Simple authentication check derived from auth store and page data
export const isAuthenticated = derived(
  [auth, page], 
  ([$auth, $page]) => $auth.authenticated || $page.data?.isAuthenticated || false
);

// Helper function to check if user is logged in (for use in components)
export function checkAuthentication(authState: any, pageData: any): boolean {
  return authState?.authenticated || pageData?.isAuthenticated || false;
}

// Helper to require authentication - throws error if user is not authenticated
export function requireAuthentication(authState: any, pageData: any): void {
  if (!checkAuthentication(authState, pageData)) {
    throw new Error('Authentication required');
  }
}