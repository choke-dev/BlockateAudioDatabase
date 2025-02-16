import * as ClassicFriendsApi from "openblox/classic/friends";
import { setConfig } from "openblox/config";

const WHITELIST_BOT_USERID = 4572614730

async function getXCSRFToken(accountCookie: string) {
    const response = await fetch("https://auth.roblox.com/v2/login", {
        method: "POST",
        headers: {
            "cookie": `.ROBLOSECURITY=${accountCookie}` 
        }
    })

    const X_CSRF_TOKEN = response.headers.get("x-csrf-token")
    if (X_CSRF_TOKEN) {
        return X_CSRF_TOKEN;
    } else {
        throw new Error('Did not receive X-CSRF-TOKEN')
    }
}

async function isFriendsWithWhitelistBot(credentials: { opencloudAPIKey: string, accountCookie: string, userId: string }) {
    //@ts-ignore
    const friendsList = await ClassicFriendsApi.friendsList.bind({ cookie: credentials.accountCookie, cloudKey: credentials.opencloudAPIKey })({ userId: credentials.userId });
    const isFriendsWithWhitelistBot = friendsList.data.some(friend => friend.id === WHITELIST_BOT_USERID);
    return isFriendsWithWhitelistBot;
}

export async function whitelistAssetToUser(credentials: { opencloudAPIKey: string, accountCookie: `_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|${string}`, userId: string }, assetId: string) {

    setConfig({ cloudKey: credentials.opencloudAPIKey, cookie: credentials.accountCookie });
    const isFriendedWithBot = await isFriendsWithWhitelistBot(credentials);
    if (!isFriendedWithBot) {
        console.log("Sending friend request to whitelist bot...")
        await ClassicFriendsApi.authenticatedUserRequestFriendship.bind({ cookie: credentials.accountCookie, cloudKey: credentials.opencloudAPIKey })({
            userId: WHITELIST_BOT_USERID,
            originSourceType: "UserProfile",
        })
        while (!(await isFriendsWithWhitelistBot(credentials))) {
            console.log("Waiting for whitelist bot to accept friend request...")
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    const X_CSRF_TOKEN = await getXCSRFToken(credentials.accountCookie)
    if (!X_CSRF_TOKEN) {
        throw new Error("Couldn't fetch X-CSRF-Token")
    }

    const permissionUpdateResponse = await fetch(`https://apis.roblox.com/asset-permissions-api/v1/assets/${assetId}/permissions`, {
        method: "PATCH",
        headers: {
            "Cookie": `.ROBLOSECURITY=${credentials.accountCookie}`,
            "x-csrf-token": X_CSRF_TOKEN,
            "Content-Type": "application/json-patch+json"
        },
        body: JSON.stringify({
            requests: [
                {
                    action: "Use",
                    subjectId: WHITELIST_BOT_USERID,
                    subjectType: "User"
                }
            ]
        })
    });
    if (permissionUpdateResponse.ok) {
        return { success: true };
    } else {
        return { success: false, error: await permissionUpdateResponse.text() }
    }
}