import { MAX_SEARCH_RESULTS_PER_PAGE } from "$lib/config/search";
import { RetryAfterRateLimiter } from 'sveltekit-rate-limiter/server';
import { prisma } from "$lib/server/db";
import { SearchFilterSchema, SearchRequestSchema } from "$lib/zodSchemas";
import type { RequestHandler } from "./$types";
import { RATELIMIT_SECRET } from "$env/static/private";

export const _limiter = new RetryAfterRateLimiter({
    IP: [5, 's'],
    // IPUA: [3, 's'],
    // cookie: {
    //   name: 'limiterId',
    //   secret: RATELIMIT_SECRET,
    //   rate: [5, 's'],
    //   preflight: true,
    // }
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
        
        // Check for empty 'keyword' parameter
        // if (query && query.length === 0) {
        //     return new Response(
        //         JSON.stringify({ errors: [{ message: 'Query parameter "keyword" is empty' }] }),
        //         { status: 400 }
        //     );
        // }

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
        const whereClause: any = {};
        
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
        
        const audios = await prisma.audio.findMany({
            where: whereClause,
            skip: (currentPage - 1) * MAX_SEARCH_RESULTS_PER_PAGE,
            take: MAX_SEARCH_RESULTS_PER_PAGE,
            ...sortOption
        });

        

        // Fetch total count of audios that match the query
        const total = await prisma.audio.count({
            where: whereClause,
        });

        // Return the results and total count
        return new Response(
            JSON.stringify({ items: audios, total }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)),
            { status: 200 }
        );
    } catch (error) {
        // Handle any unexpected errors
        console.error("Server Error:", error);

        return new Response(
            JSON.stringify({ errors: [{ message: 'An unexpected error occurred' }] }),
            { status: 500 }
        );
    }
};