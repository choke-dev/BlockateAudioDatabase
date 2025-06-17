import { FUZZY_SEARCH_THRESHOLD, MAX_SEARCH_RESULTS_PER_PAGE } from "$lib/config/search";
import { prisma } from "$lib/server/db";
import { SearchRequestSchema } from "$lib/zodSchemas";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import { RetryAfterRateLimiter } from 'sveltekit-rate-limiter/server';
import type { RequestHandler } from "./$types";

export const _limiter = new RetryAfterRateLimiter({
    IP: [5, 's']
});

export const POST: RequestHandler = async (event) => {
    const status = await _limiter.check(event);
    if (status.limited) {
        return new Response(JSON.stringify({ 
            errors: [ { message: `You are being rate limited. Please try again after ${status.retryAfter} second${Math.abs(status.retryAfter) === 1 ? '' : 's'}.` } ] }),
            { status: 429 }
        )
    }

    try {
        // Check for missing 'keyword' query parameter
        if (!event.url.searchParams.has('keyword')) {
            return new Response(
                JSON.stringify({ errors: [{ message: 'Missing "keyword" query parameter' }] }),
                { status: 400 }
            );
        }

        const query = event.url.searchParams.get('keyword');
        
        // Fetch paginated audios from the database
        const pageParam = event.url.searchParams.get('page');
        const currentPage = pageParam ? Number(pageParam) : 1;

        if (isNaN(currentPage) || currentPage < 1) {
            return new Response(
                JSON.stringify({ errors: [{ message: 'Invalid "page" query parameter' }] }),
                { status: 400 }
            );
        }

        const parsedRequestBody = await event.request.json();
        const requestBody = SearchRequestSchema.safeParse(parsedRequestBody);

        let filterConditions: Record<string, { contains: string; mode: 'insensitive' }>[] = [];
        let sortOption = {};
        let filterType = "AND";
        
        if (requestBody.success) {
            // Handle filters
            if (requestBody.data!.filters && requestBody.data!.filters.filters) {
                const filterData = requestBody.data!.filters.filters;
                
                // Only add filters with non-empty inputValue
                filterConditions = filterData
                    .filter(({ inputValue }) => inputValue.trim() !== '')
                    .map(({ label, value, inputValue }: { label: string; value: string; inputValue: string }) => {
                        return {
                            [value]: {
                                contains: inputValue.trim(),
                                mode: 'insensitive',
                            },
                        };
                    });
                
                // Set filter type (AND/OR)
                if (requestBody.data!.filters.type) {
                    filterType = requestBody.data!.filters.type.toUpperCase();
                }
            }
            
            // Handle sort
            if (requestBody.data!.sort) {
                const { field, order } = requestBody.data!.sort;
                sortOption = {
                    orderBy: {
                        [field]: order
                    }
                };
            }
        }

        // Construct the where clause
        const whereClause: any = {
            private: false
        };
        
        // Add name search if query exists
        if (query) {
            whereClause.name = {
                contains: query,
                mode: 'insensitive',
            };
        }
        
        // Add filter conditions if they exist
        if (filterConditions.length > 0) {
            whereClause[filterType] = filterConditions;
        }
        
        let audios;
        let total;
        
        // Check if query exists and use either SIMILARITY or standard search
        if (query) {
            try {
                // Promisify the search and count operations to run concurrently
                const [searchResults, countResults] = await Promise.all([
                    // Query for audio results
                    prisma.$queryRaw<any[]>`
                        SELECT * FROM "Audio"
                        WHERE private = false
                        AND (
                            name ILIKE ${`%${query}%`} OR
                            SIMILARITY(name, ${query}::text) > ${FUZZY_SEARCH_THRESHOLD}
                        )
                        ORDER BY SIMILARITY(name, ${query}::text) DESC
                        LIMIT ${MAX_SEARCH_RESULTS_PER_PAGE}
                        OFFSET ${(currentPage - 1) * MAX_SEARCH_RESULTS_PER_PAGE}
                    `,
                    
                    // Query for total count
                    prisma.$queryRaw<{ count: BigInt }[]>`
                        SELECT COUNT(*) as count FROM "Audio"
                        WHERE private = false
                        AND (
                            name ILIKE ${`%${query}%`} OR
                            SIMILARITY(name, ${query}::text) > ${FUZZY_SEARCH_THRESHOLD}
                        )
                    `
                ]);
                
                audios = searchResults;
                total = Number(countResults[0].count);
            } catch (error) {
                // If SIMILARITY fails, fall back to standard ILIKE search
                console.warn("SIMILARITY search failed, falling back to ILIKE:", error);
                
                // Promisify the standard search and count operations
                const [searchResults, countResult] = await Promise.all([
                    // Standard Prisma query for results
                    prisma.audio.findMany({
                        where: whereClause,
                        skip: (currentPage - 1) * MAX_SEARCH_RESULTS_PER_PAGE,
                        take: MAX_SEARCH_RESULTS_PER_PAGE,
                        ...sortOption
                    }),
                    
                    // Standard Prisma query for count
                    prisma.audio.count({
                        where: whereClause,
                    })
                ]);
                
                audios = searchResults;
                total = countResult;
            }
        } else {
            // If no query, use standard Prisma query with Promise.all
            const [searchResults, countResult] = await Promise.all([
                prisma.audio.findMany({
                    where: whereClause,
                    skip: (currentPage - 1) * MAX_SEARCH_RESULTS_PER_PAGE,
                    take: MAX_SEARCH_RESULTS_PER_PAGE,
                    ...sortOption
                }),
                
                prisma.audio.count({
                    where: whereClause,
                })
            ]);
            
            audios = searchResults;
            total = countResult;
        }

        // Check if the requested page is within bounds
        const maxPage = Math.ceil(total / MAX_SEARCH_RESULTS_PER_PAGE);
        if (currentPage > maxPage && total > 0) {
            return new Response(
                JSON.stringify({
                    errors: [{ message: `Page ${currentPage} is out of bounds. Max available page is ${maxPage}.` }]
                }),
                { status: 400 }
            );
        }

        // Return the results and total count
        return new Response(
            JSON.stringify({ items: audios, total }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)),
            { status: 200 }
        );
    } catch (error) {
        // Handle any unexpected errors
        console.error("Server Error:", error);

        if (error instanceof PrismaClientInitializationError) {
            return new Response(
                JSON.stringify({ errors: [{ message: 'Could not contact audio database, please try again later.' }] }),
                { status: 500 }
            );
        }

        return new Response(
            JSON.stringify({ errors: [{ message: 'An unexpected error occurred' }] }),
            { status: 500 }
        );
    }
};