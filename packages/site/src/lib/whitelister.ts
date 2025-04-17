const templates: Record<WhitelisterType, (id: string) => string> = {
    discord: (userId) => `https://discord.com/users/${userId}`,
    roblox:  (userId) => `https://roblox.com/users/${userId}/profile`,
};

export type WhitelisterType = "discord" | "roblox" | string; 
export const buildWhitelisterUrl = (type: WhitelisterType, id: string | bigint): string => {
    id = id.toString();
    return type in templates ? templates[type](id) : `#`;
};
