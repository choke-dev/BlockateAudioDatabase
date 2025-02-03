async function getXCSRFToken(accountCookie: string) {
    const response = await fetch("https://auth.roblox.com/v2/logout", {
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

export async function whitelistAssetToUser(credentials: { opencloudAPIKey: string, accountCookie: string }, assetId: string) {

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
                    subjectId: 196632240,
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