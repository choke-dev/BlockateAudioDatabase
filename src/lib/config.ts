const MODE = import.meta.env.MODE;
export const BASE_URL = MODE === 'development' ? 'http://localhost:5173' : 'https://blockateaudiodb.choke.dev';

export const DISCORD_CLIENT_ID = "1327153407286579270";
export const ROBLOX_CLIENT_ID = "7919966279299549540";

export const MAX_SEARCH_RESULTS_PER_PAGE = 25;

// If true, will only allow users in USER_PERMISSIONS to login and access the dashboard.
export const ENFORCE_LOGIN_WHITELIST = true;
export const ROUTE_PERMISSIONS: Record<string, number> = {
	'/dashboard': 1,
    '/api/dashboard': 1
};
export const USER_PERMISSIONS: Record<string, number> = {
    "208876506146013185": 1,
    "1096213302654275594": 1,
    "1228943796251791360": 1
};