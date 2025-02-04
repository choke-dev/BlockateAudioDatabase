const MODE = import.meta.env.MODE;
export const BASE_URL = MODE === 'development' ? 'http://localhost:5173' : 'https://blockateaudiodb.choke.dev';

// If true, will only allow users in USER_PERMISSIONS to login and access the dashboard.
export const ENFORCE_LOGIN_WHITELIST = false;
export const ROUTE_PERMISSIONS: Record<string, number> = {
	'/dashboard': 0,

    // API Routes
    '/api/audio/upload': 0,
    '/api/audio/requests': 1,
    '/api/dashboard/audio': 2,
};
export const USER_PERMISSIONS: Record<string, number> = {
    "208876506146013185": 3, // choke
    "1096213302654275594": 3, // zoydim
    "1228943796251791360": 3, // koral.reefz

    "547716250629832704": 1, // dg99doomguy
    "1144775173833232466": 1, // manafestation
    "455059432003338242": 1, // ganderest
    "670725649991729198": 1, // mequritsu
    "1155782735340781619": 1, // synthpurple (the group is very tiny)
};