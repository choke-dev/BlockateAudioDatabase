import { RATELIMIT_SECRET } from '$env/static/private';
import { MAX_SEARCH_RESULTS_PER_PAGE } from '$lib/config/search';
import { prisma } from '$lib/server/db';
import { SearchFilterSchema } from '$lib/zodSchemas';
import { RetryAfterRateLimiter } from 'sveltekit-rate-limiter/server';

export const _limiter = new RetryAfterRateLimiter({
    IP: [1, 's'],
    IPUA: [3, 's'],
    cookie: {
      name: 'limiterId',
      secret: RATELIMIT_SECRET,
      rate: [5, 's'],
      preflight: true
    }
});

export const actions = {
    search: async (event) => {
        const status = await _limiter.check(event);
        if (status.limited) {
            return new Response(JSON.stringify({
                errors: [ { message: `You are being rate limited. Please try again after ${status.retryAfter} second${Math.abs(status.retryAfter) === 1 ? '' : 's'}.` } ]
            }), {
                status: 429
            });
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
            const requestBody = SearchFilterSchema.safeParse(parsedRequestBody);

            let filterConditions: Record<string, { contains: string; mode: 'insensitive' }>[] = [];
            if (requestBody.success) {
                const filterData = requestBody.data!.filters;
                filterConditions = filterData.map(({ label, value, inputValue }: { label: string; value: string; inputValue: string }) => {
                    return {
                        [value]: {
                            contains: inputValue,
                            mode: 'insensitive',
                        },
                    };
                });
            }

            console.log(filterConditions)

            const audios = await prisma.audio.findMany({
                where: {
                    name: query ? {
                        contains: query,
                        mode: 'insensitive',
                    } : undefined,
                    [requestBody.data ? requestBody.data.filterType.toUpperCase() : 'AND']: filterConditions,
                },
                skip: (currentPage - 1) * MAX_SEARCH_RESULTS_PER_PAGE,
                take: MAX_SEARCH_RESULTS_PER_PAGE,
            });

            // Fetch total count of audios that match the query
            const total = await prisma.audio.count({
                where: {
                    name: query ? {
                        contains: query,
                        mode: 'insensitive',
                    } : undefined,
                    [requestBody.data ? requestBody.data.filterType.toUpperCase() : 'AND']: filterConditions,
                },
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
    },
}