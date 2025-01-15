import { DISCORD_CLIENT_SECRET } from '$env/static/private';
import { BASE_URL, DISCORD_CLIENT_ID } from '$lib/config';

import * as arctic from 'arctic';
import { prisma } from './db';

const roblox = new arctic.Discord(
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	`${BASE_URL}/api/oauth/discord/callback`
);

function stringToHex(str: string) {
    return Array.from(str)
      .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
}

function hexToString(hex: string): string | null {
    if (!hex) return null;
    const matches = hex.match(/.{1,2}/g);
    if (!matches) return null;
    return matches
      .map(byte => String.fromCharCode(parseInt(byte, 16)))
      .join('');
}
  

export async function createAuthorizationURL(state?: string): Promise<{ success: boolean; data: URL | Error }> {
    state = `${arctic.generateState()}${stringToHex(`%E2%80%8B${state}` || '')}`;
	const codeVerifier = arctic.generateCodeVerifier();
	const scopes = ['openid', 'identify'];
	const url = roblox.createAuthorizationURL(state, codeVerifier, scopes);

	const result = await prisma.state
		.create({
			data: {
				state: state,
				codeVerifier: codeVerifier
			}
		})
		.catch(null);

	if (!result) {
		return { success: false, data: new Error('Failed to create state') };
	}

	return { success: true, data: url };
}

export async function validateAuthorizationCode(
	code: string,
	state: string
): Promise<{ success: boolean; info: { OAuth2Tokens: { accessToken: string, accessTokenExpiresAt: Date, refreshToken: string }; userInfo: Record<string, unknown>, redirectURI:string | null } | Error }> {

    const stateData = await prisma.state.findFirst({
        where: {
            state: state
        }
    });
    if (!stateData) return { success: false, info: new Error('Invalid state') };

    const redirectURI = hexToString(stateData.state.split('%E2%80%8B')[1]);
    const codeVerifier = stateData.codeVerifier;

	try {
		const tokens = await roblox.validateAuthorizationCode(code, codeVerifier);
		const accessToken = tokens.accessToken();
		const accessTokenExpiresAt = tokens.accessTokenExpiresAt();
		const refreshToken = tokens.refreshToken();
        const tokenType = tokens.tokenType();

        prisma.state.delete({
            where: {
                id: stateData.id
            }
        });
        
        const userInfoResponse = await fetch('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                'Authorization': `${tokenType} ${accessToken}`
            }
        })
        if (!userInfoResponse.ok) return { success: false, info: new Error('Failed to fetch user info') };
        const userInfo = await userInfoResponse.json();
        await prisma.user.upsert({
            where: {
                id: userInfo.id
            },
            update: {
                username: userInfo.username,
                global_name: userInfo.global_name,
                avatar: userInfo.avatar,
                bot: userInfo.bot,
                system: userInfo.system,
                mfa_enabled: userInfo.mfa_enabled,
                banner: userInfo.banner,
                accent_color: userInfo.accent_color,
                locale: userInfo.locale,
                flags: userInfo.flags,
                premium_type: userInfo.premium_type,
                public_flags: userInfo.public_flags
            },
            create: {
                id: userInfo.id,
                username: userInfo.username,
                global_name: userInfo.global_name,
                avatar: userInfo.avatar,
                bot: userInfo.bot,
                system: userInfo.system,
                mfa_enabled: userInfo.mfa_enabled,
                banner: userInfo.banner,
                accent_color: userInfo.accent_color,
                locale: userInfo.locale,
                flags: userInfo.flags,
                premium_type: userInfo.premium_type,
                public_flags: userInfo.public_flags
            }
        })
        
        return { success: true, info: { OAuth2Tokens: { accessToken, accessTokenExpiresAt, refreshToken }, userInfo: userInfo, redirectURI: redirectURI } };

	} catch (e) {
		if (e instanceof arctic.OAuth2RequestError) {
            return { success: false, info: new Error(`${e.name}: ${e.description}`) };
		}
		if (e instanceof arctic.ArcticFetchError) {
			const cause = e.cause;
            return { success: false, info: new Error('Internal error') };
		}
        //@ts-ignore
        return { success: false, info: new Error(e?.message || 'Unknown error') };
	}
}
