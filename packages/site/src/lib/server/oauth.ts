import { ROBLOX_CLIENT_SECRET } from "$env/static/private";
import {
  ROBLOX_CLIENT_ID,
  ROBLOX_REDIRECT_URI,
  ROBLOX_OAUTH_ENDPOINTS,
  ROBLOX_SCOPES
} from "$lib/config/oauth.js";
import { prisma } from "./db.js";
import { randomBytes } from "crypto";
import { sha256 } from "@oslojs/crypto/sha2";

export interface RobloxUserInfo {
  sub: string;
  name: string;
  nickname: string;
  preferred_username: string;
  profile: string;
  picture: string;
  website: string;
  created_at: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export class RobloxOAuthService {
  private clientId = ROBLOX_CLIENT_ID;
  private clientSecret = ROBLOX_CLIENT_SECRET;

  /**
   * Generate PKCE code verifier and challenge
   */
  generatePKCE() {
    // Generate code verifier: 43-128 characters, using [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
    const codeVerifier = randomBytes(32).toString('base64url').replace(/[+/=]/g, '');
    // Ensure it's at least 43 characters
    const finalCodeVerifier = codeVerifier.length >= 43 ? codeVerifier : codeVerifier + randomBytes(16).toString('base64url').replace(/[+/=]/g, '');
    
    // Create code challenge using SHA256 and proper Base64-URL encoding
    const hash = sha256(new TextEncoder().encode(finalCodeVerifier));
    const codeChallenge = Buffer.from(hash).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return {
      codeVerifier: finalCodeVerifier,
      codeChallenge,
      codeChallengeMethod: "S256" as const
    };
  }

  /**
   * Generate authorization URL with PKCE
   */
  getAuthorizationUrl(state: string, codeChallenge: string, hostname: string) {
    const redirectUri = this.getRedirectUri(hostname);
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: ROBLOX_SCOPES.join(" "),
      response_type: "code",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    });

    return `${ROBLOX_OAUTH_ENDPOINTS.authorization}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, codeVerifier: string, hostname: string): Promise<TokenResponse> {
    const redirectUri = this.getRedirectUri(hostname);
    const response = await fetch(ROBLOX_OAUTH_ENDPOINTS.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
        code_verifier: codeVerifier
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(ROBLOX_OAUTH_ENDPOINTS.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get user info from Roblox API
   */
  async getUserInfo(accessToken: string): Promise<RobloxUserInfo> {
    const response = await fetch(ROBLOX_OAUTH_ENDPOINTS.userInfo, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get user info: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Revoke refresh token (when user de-authorizes)
   * Note: Roblox only supports revoking refresh tokens, not access tokens
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const response = await fetch(ROBLOX_OAUTH_ENDPOINTS.revoke, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        token: refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Refresh token revocation failed: ${response.status} ${errorText}`);
      // Don't throw here as revocation might fail if token is already invalid
    }
  }

  /**
   * Store or update OAuth tokens in database
   */
  async storeTokens(userId: string, tokens: TokenResponse): Promise<void> {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.oAuthToken.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "roblox"
        }
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope,
        updatedAt: new Date()
      },
      create: {
        userId,
        provider: "roblox",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope
      }
    });
  }

  /**
   * Get stored tokens for a user
   */
  async getStoredTokens(userId: string) {
    return await prisma.oAuthToken.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "roblox"
        }
      }
    });
  }

  /**
   * Get valid access token for user (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string | null> {
    const storedTokens = await this.getStoredTokens(userId);
    
    if (!storedTokens) {
      return null;
    }

    // Check if token is still valid (with 5 minute buffer)
    const now = new Date();
    const expiresAt = storedTokens.expiresAt;
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (expiresAt && now.getTime() < (expiresAt.getTime() - bufferTime)) {
      return storedTokens.accessToken;
    }

    // Token is expired or about to expire, try to refresh
    if (storedTokens.refreshToken) {
      try {
        const newTokens = await this.refreshAccessToken(storedTokens.refreshToken);
        await this.storeTokens(userId, newTokens);
        return newTokens.access_token;
      } catch (error) {
        console.error("Failed to refresh token:", error);
        // If refresh fails, remove the invalid tokens
        await this.removeTokens(userId);
        return null;
      }
    }

    return null;
  }

  /**
   * Remove stored tokens (when user de-authorizes or tokens are invalid)
   */
  async removeTokens(userId: string): Promise<void> {
    await prisma.oAuthToken.deleteMany({
      where: {
        userId,
        provider: "roblox"
      }
    });
  }

  /**
   * Create or update user from Roblox user info
   */
  async createOrUpdateUser(userInfo: RobloxUserInfo): Promise<string> {
    const user = await prisma.user.upsert({
      where: {
        robloxId: userInfo.sub
      },
      update: {
        username: userInfo.preferred_username || userInfo.name,
        avatar: userInfo.picture,
        updatedAt: new Date()
      },
      create: {
        robloxId: userInfo.sub,
        username: userInfo.preferred_username || userInfo.name,
        avatar: userInfo.picture
      }
    });

    return user.id;
  }

  /**
   * Generate redirect URI based on hostname
   */
  private getRedirectUri(hostname: string): string {
    // Determine protocol based on hostname
    const protocol = hostname.includes('localhost') || hostname.includes('127.0.0.1') ? 'http' : 'https';
    return `${protocol}://${hostname}/api/oauth/roblox/callback`;
  }
}

export const robloxOAuth = new RobloxOAuthService();