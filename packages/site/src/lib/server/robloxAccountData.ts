type AudioQuotas = {
    quotas: { 
        duration: 'Month',
        usage: number,
        capacity: number,
        expirationTime: string
    }[]
}

export const retrieveAccountAudioQuota = async (cookie: string): Promise< { success: boolean; data: AudioQuotas | any } > => {

    const response = await fetch('https://publish.roblox.com/v1/asset-quotas?resourceType=RateLimitUpload&assetType=Audio', {
        method: 'GET',
        headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`
        }
    });

    if (!response.ok) {
        return { success: false, data: null };
    }

    return { success: true, data: await response.json() };
}