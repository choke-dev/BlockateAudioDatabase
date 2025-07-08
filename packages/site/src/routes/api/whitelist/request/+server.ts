import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth.js';
import { prisma } from '$lib/server/db.js';
import { WhitelistRequestSchema } from '$lib/zodSchemas.js';
import { z } from 'zod';

export const POST: RequestHandler = async (event) => {
    try {
        // Require authentication
        const user = await requireAuth(event);
        
        // Parse and validate request body
        const body = await event.request.json();
        const { audioId, name, category, reason } = WhitelistRequestSchema.parse(body);
        
        // Check if user already has a pending or approved request for this audio ID
        const existingRequest = await prisma.whitelistRequest.findUnique({
            where: {
                audioId_userId: {
                    audioId,
                    userId: user.id
                }
            }
        });
        
        if (existingRequest) {
            switch(existingRequest.status) {
                case 'PENDING':
                    return json(
                        { error: 'There is already a pending request for this audio ID' },
                        { status: 409 }
                    );
                case 'APPROVED':
                    return json(
                        { error: 'This audio ID is already whitelisted for Blockate.' },
                        { status: 409 }
                    );
                case 'REJECTED':
                    return json(
                        { error: 'The request for this audio ID has been rejected.' },
                        { status: 409 }
                    )
            }
        }
        
        // Create new whitelist request
        const whitelistRequest = await prisma.whitelistRequest.create({
            data: {
                audioId,
                name,
                category,
                userId: user.id,
                reason: reason || null,
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