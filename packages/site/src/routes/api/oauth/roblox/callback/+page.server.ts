// src/routes/auth/callback/+page.server.ts
import { redirect } from '@sveltejs/kit';
import { robloxOAuth } from '$lib/server/oauth.js';
import { sessionService } from '$lib/server/session.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      throw redirect(302, '/?error=oauth_error');
    }
    if (!code || !state) {
      throw redirect(302, '/?error=missing_parameters');
    }

    const storedState = cookies.get('oauth_state');
    if (!storedState || storedState !== state) {
      throw redirect(302, '/?error=invalid_state');
    }

    const codeVerifier = cookies.get('oauth_code_verifier');
    if (!codeVerifier) {
      throw redirect(302, '/?error=missing_verifier');
    }

    cookies.delete('oauth_state', { path: '/' });
    cookies.delete('oauth_code_verifier', { path: '/' });

    const hostname = url.hostname + (url.port ? `:${url.port}` : '');
    const tokens = await robloxOAuth.exchangeCodeForTokens(code, codeVerifier, hostname);
    const userInfo = await robloxOAuth.getUserInfo(tokens.access_token);
    const userId = await robloxOAuth.createOrUpdateUser(userInfo);
    await robloxOAuth.storeTokens(userId, tokens);

    const sessionId = await sessionService.createSession(userId);
    cookies.set('session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

  } catch (err) {
    console.error('OAuth callback error:', err);
    if (err instanceof Response && err.status >= 300 && err.status < 400) {
      throw err;
    }
    throw redirect(302, '/?error=oauth_callback_failed');
  }

  throw redirect(302, '/?success=oauth_callback_success');
};
