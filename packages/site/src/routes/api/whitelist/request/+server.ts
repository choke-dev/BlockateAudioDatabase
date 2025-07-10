import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth.js';
import { prisma, supabase } from '$lib/server/db.js';
import { WhitelistRequestSchema } from '$lib/zodSchemas.js';
import { z } from 'zod';
import { FetchError, ofetch } from 'ofetch';
import { AUDIO_FILE_PROXY_AUTH, ROBLOX_ACCOUNT_COOKIE } from '$env/static/private';

const whitelistRequestChannel = supabase.channel('audio-whitelist')

export const POST: RequestHandler = async (event) => {
    try {
        // Require authentication
        const user = await requireAuth(event);
        
        // Parse and validate request body
        const body = await event.request.json();
        const { audioId, name, category, is_private } = WhitelistRequestSchema.parse(body);
        
        const [existingRequest, isWhitelisted] = await Promise.all([
            prisma.whitelistRequest.findUnique({
                where: {
                    audioId_userId: {
                        audioId,
                        userId: user.id
                    }
                }
            }),
            prisma.audios.findUnique({
                where: {
                    id: audioId
                },
                select: { id: true } // Only check existence
            })
        ]);

        if (isWhitelisted) {
            return json(
                { error: 'This audio ID is already whitelisted for Blockate.' },
                { status: 400 }
            );
        }

        if (existingRequest) {
            const messages = {
                'PENDING': 'There is already a pending request for this audio ID',
                'APPROVED': 'This audio ID is already whitelisted for Blockate.',
                'REJECTED': 'The request for this audio ID has been rejected.'
            };
            return json(
                { error: messages[existingRequest.status] },
                { status: 400 }
            );
        }

        // Validation Checks
        // Check if audio ID is valid
        let audioMetadata;
        try {
            audioMetadata = await ofetch(`https://apis.roblox.com/assets/user-auth/v1/assets/${audioId}?readMask=assetId,assetType,creationContext,description,displayName,moderationResult,icon,previews,revisionCreateTime,State`, {
                headers: {
                    Cookie: `.ROBLOSECURITY=${ROBLOX_ACCOUNT_COOKIE}`
                }
            })
        } catch(err) {
            if (!(err instanceof FetchError)) return json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });

            if (err.response?.status === 404) {
                return json({ error: "The provided audio ID does not exist." }, { status: 404 });
            }
        }

        if (audioMetadata.assetType !== "Audio") {
            return json({ error: "The provided ID is not an audio asset." }, { status: 400 });
        }

        console.dir(audioMetadata)
        const moderationState = audioMetadata.moderationResult.moderationState; // "Approved", "Rejected", "Reviewing"
        switch(moderationState) {
            case "Rejected":
                return json({ error: "The provided audio ID has been rejected by Roblox moderation." }, { status: 400 });
            case "Reviewing":
                return json({ error: "The provided audio ID is currently under review by Roblox moderation. Please try again later." }, { status: 400 });
        }

        // Check if audio ID is accessible
        const audioUrlsResponse = await ofetch.raw('http://109.106.244.58:3789/audio/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: AUDIO_FILE_PROXY_AUTH
            },
            body: [Number(audioId)]
        });

		if (!audioUrlsResponse.ok) {
			return json({ error: 'Failed to check audio accessibility, please try again later.' }, { status: 500 });
		}

		if (audioUrlsResponse._data[0]?.code === 403) {
            return json({ error: 'BMusicUploader does not have "Use" permissions for this audio. Please grant them the "Use" permission in the audio\'s permissions page.' }, { status: 400 });
		}
        
        // Create new whitelist request
        const whitelistRequest = await prisma.whitelistRequest.create({
            data: {
                audioId,
                name,
                category,
                userId: user.id,
                private: is_private,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        username: true,
                        robloxId: true
                    }
                }
            }
        });

        whitelistRequestChannel.send({
            type: "broadcast",
            event: "new-whitelist-request",
            payload: {
                ...whitelistRequest,
                audioUrl: audioUrlsResponse._data[0]
            }
        })
        
        return json({
            id: whitelistRequest.id,
            audioId: whitelistRequest.audioId,
            name: whitelistRequest.name,
            category: whitelistRequest.category,
            userId: whitelistRequest.userId,
            reason: whitelistRequest.reason,
            status: whitelistRequest.status,
            createdAt: whitelistRequest.createdAt.toISOString(),
            updatedAt: whitelistRequest.updatedAt.toISOString()
        });
        
    } catch (error) {
        console.error('Whitelist request error:', error);
        
        if (error instanceof z.ZodError) {
            return json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }
        
        if (error instanceof Error && error.message === 'Authentication required') {
            return json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }
        
        return json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

export const GET: RequestHandler = async (event) => {
    try {
        // Require authentication
        const user = await requireAuth(event);
        
        // Get user's whitelist requests
        const requests = await prisma.whitelistRequest.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        return json(
            requests.map(request => ({
                id: request.id,
                audioId: request.audioId,
                name: request.name,
                category: request.category,
                userId: request.userId,
                reason: request.reason,
                status: request.status,
                createdAt: request.createdAt.toISOString(),
                updatedAt: request.updatedAt.toISOString()
            }))
        );
        
    } catch (error) {
        console.error('Get whitelist requests error:', error);
        
        if (error instanceof Error && error.message === 'Authentication required') {
            return json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }
        
        return json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};