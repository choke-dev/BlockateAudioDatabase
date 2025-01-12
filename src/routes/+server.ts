import { prisma } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
    try {
        // Check for missing 'keyword' query parameter
        if (!url.searchParams.has('keyword')) {
            return new Response(
                JSON.stringify({ errors: [{ message: 'Missing "keyword" query parameter' }] }),
                { status: 400 }
            );
        }

        const query = url.searchParams.get('keyword');
        
        // Check for empty 'keyword' parameter
        if (query && query.length === 0) {
            return new Response(
                JSON.stringify({ errors: [{ message: 'Query parameter "keyword" is empty' }] }),
                { status: 400 }
            );
        }

        // Fetch paginated audios from the database
        const pageParam = url.searchParams.get('page');
        const currentPage = pageParam ? Number(pageParam) : 1;

        if (isNaN(currentPage) || currentPage < 1) {
            return new Response(
                JSON.stringify({ errors: [{ message: 'Invalid "page" query parameter' }] }),
                { status: 400 }
            );
        }

        // Fetch results based on the keyword and pagination
        const audios = await prisma.audio.findMany({
            where: {
                name: {
                    contains: query!,
                    mode: 'insensitive',
                },
            },
            skip: (currentPage - 1) * 100,  // Skipping by a multiplier of 100
            take: 100,  // Fetch 100 items per page
        });

        // Fetch total count of audios that match the query
        const total = await prisma.audio.count({
            where: {
                name: {
                    contains: query!,
                    mode: 'insensitive',
                },
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
};
