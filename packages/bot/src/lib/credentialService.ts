import { CACHE_TTL } from "./config/credentialService";
import { prisma } from "./database";

interface Credential {
    opencloudAPIKey: string;
    accountCookie: string;
    userId: string;
}

interface Credentials {
    description: string;
    decrypted_secret: Credential;
}

const credentialsCache: { 
    cacheExpiration: number;
    credentials: Credentials[]
} = {
    cacheExpiration: 0,
    credentials: []
};

export const getBots = async (): Promise<Credentials[]> => {

    if (credentialsCache.cacheExpiration < Date.now()) {
        // cache expired
        console.log("[ CREDENTIAL SERVICE ] Cache miss, fetching for potentially new credentials...")
        const data: { description: string, decrypted_secret: Credential }[] = await prisma.$queryRaw`
            select description, decrypted_secret from vault.decrypted_secrets;
        `

        credentialsCache.cacheExpiration = Date.now() + CACHE_TTL
        credentialsCache.credentials = data.map(x => ({
            description: x.description,
            decrypted_secret: JSON.parse(String(x.decrypted_secret))
        }))

        return credentialsCache.credentials
    } else {
        console.log("[ CREDENTIAL SERVICE ] Cache hit, returning cached credentials...")
        return credentialsCache.credentials
    }

}