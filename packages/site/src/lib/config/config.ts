const MODE = import.meta.env.MODE;
export const BASE_URL = MODE === 'development' ? 'http://localhost:5173' : 'https://blockateaudiodb.choke.dev';