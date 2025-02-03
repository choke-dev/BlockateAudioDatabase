import { prisma, supabase } from "$lib/server/db";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ request }) => {
    // Fetch all requests from the database
    const requests = await prisma.requests.findMany();
    
    // If no requests are found, return a 404 response
    if (!requests || requests.length === 0) {
        return new Response(JSON.stringify({ 
            success: false, 
            errors: [{ message: 'No requests found', code: 'no_requests_found' }] 
        }), { status: 404 });
    }

    // Extract file paths from the requests
    const filePaths = requests.map((request) => request.filePath);

    // Generate signed URLs for the files
    const { data: signedUrls, error } = await supabase
        .storage
        .from('whitelistrequests')
        .createSignedUrls(filePaths, 3600); // 1 hour expiration time

    // If there's an error generating the signed URLs, return a 500 response
    if (error) {
        console.error(error);
        return new Response(JSON.stringify({ 
            success: false, 
            errors: [{ message: error.message, code: 'unknown_error' }] 
        }), { status: 500 });
    }

    // Map the signed URLs back to the requests
    const requestsWithFileURLs = requests.map((request, index) => {
        return {
            ...request,
            fileURL: signedUrls[index].signedUrl // Assign the signed URL to the request
        };
    });

    // Return the requests with the signed URLs
    return new Response(JSON.stringify({ 
        success: true, 
        data: requestsWithFileURLs 
    }), { status: 200 });
};