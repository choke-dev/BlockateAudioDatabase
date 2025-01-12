const MODE = import.meta.env.MODE
export const BASE_URL = MODE === 'development' ? 'http://localhost:5173' : 'https://blockateaudiodb.choke.dev'
export const ROBLOX_CLIENT_ID = "7919966279299549540"

// If true, will only allow users in USER_PERMISSIONS to login and access the dashboard.
export const ENFORCE_LOGIN_WHITELIST = true
export const ROUTE_PERMISSIONS: Record<string, number> = {
	'/dashboard': 1
}
export const USER_PERMISSIONS: Record<string, number> = {
    "113657695": 2,
    "144121138": 2,
    "4885174786": 2
}