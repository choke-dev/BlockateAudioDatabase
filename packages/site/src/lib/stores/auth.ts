import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { page } from '$app/stores';

export interface User {
  id: string;
  robloxId: string;
  username: string;
  avatar: string | null;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

// Create the auth store
function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: true,
    authenticated: false
  });

  return {
    subscribe,
    
    // Initialize auth state
    async init() {
      if (!browser) return;
      
      try {
        const response = await fetch('/api/oauth/user');
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          set({
            user: data.user,
            loading: false,
            authenticated: true
          });
        } else {
          set({
            user: null,
            loading: false,
            authenticated: false
          });
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        set({
          user: null,
          loading: false,
          authenticated: false
        });
      }
    },
    
    // Set user data (called from layout)
    setUser(user: User | null) {
      set({
        user,
        loading: false,
        authenticated: !!user
      });
    },
    
    // Login function
    async login() {
      if (!browser) return;
      
      update(state => ({ ...state, loading: true }));
      
      try {
        const response = await fetch('/api/oauth/roblox/login', {
          method: 'POST'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            window.location.href = data.data;
            return;
          }
        }
        
        throw new Error('Login failed');
      } catch (error) {
        console.error('Login error:', error);
        update(state => ({ ...state, loading: false }));
        throw error;
      }
    },
    
    // Logout function
    async logout() {
      if (!browser) return;
      
      try {
        await fetch('/api/oauth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        set({
          user: null,
          loading: false,
          authenticated: false
        });
        
        // Redirect to home page
        window.location.href = '/';
      }
    },
    
    // Refresh tokens
    async refreshTokens() {
      if (!browser) return false;
      
      try {
        const response = await fetch('/api/oauth/refresh', {
          method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
          return true;
        } else if (data.requiresReauth) {
          // Tokens are invalid, clear auth state
          set({
            user: null,
            loading: false,
            authenticated: false
          });
          return false;
        }
        
        return false;
      } catch (error) {
        console.error('Token refresh error:', error);
        return false;
      }
    },
    
    // Check if user needs to re-authenticate
    async checkAuthStatus() {
      if (!browser) return;
      
      try {
        const response = await fetch('/api/oauth/user');
        const data = await response.json();
        
        if (data.requiresReauth) {
          set({
            user: null,
            loading: false,
            authenticated: false
          });
        } else if (data.authenticated && data.user) {
          update(state => ({
            ...state,
            user: data.user,
            authenticated: true
          }));
        }
      } catch (error) {
        console.error('Auth status check error:', error);
      }
    }
  };
}

export const auth = createAuthStore();

// Derived store for authentication status from page data
export const isAuthenticated = derived(
  [auth, page],
  ([$auth, $page]) => $auth.authenticated || $page.data?.isAuthenticated || false
);

// Auto-refresh tokens periodically (every 50 minutes)
if (browser) {
  setInterval(() => {
    auth.refreshTokens();
  }, 50 * 60 * 1000);
}