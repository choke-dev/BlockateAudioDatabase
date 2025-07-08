import { BASE_URL } from "./config.js";

export const ROBLOX_CLIENT_ID = "7919966279299549540";
export const ROBLOX_REDIRECT_URI = `${BASE_URL}/api/oauth/roblox/callback`;

// Roblox OAuth2 endpoints
export const ROBLOX_OAUTH_ENDPOINTS = {
  authorization: "https://apis.roblox.com/oauth/v1/authorize",
  token: "https://apis.roblox.com/oauth/v1/token",
  userInfo: "https://apis.roblox.com/oauth/v1/userinfo",
  revoke: "https://apis.roblox.com/oauth/v1/token/revoke"
} as const;

// OAuth2 scopes for Roblox
export const ROBLOX_SCOPES = ["openid", "profile"] as const;