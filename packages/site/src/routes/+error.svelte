<script lang="ts">
    import { page } from "$app/state";
    import Icon from '@iconify/svelte';
    
    // Map HTTP status codes to their messages
    const httpStatusMessages = {
        400: {
            title: "Bad Request",
            message: "The request could not be processed due to a client error.",
            icon: "mdi:alert-circle-outline"
        },
        401: {
            title: "Unauthorized",
            message: "You are not authorized to access this resource.",
            icon: "lucide:user-x"
        },
        403: {
            title: "Forbidden",
            message: "You do not have permission to access this resource.",
            icon: "lucide:lock"
        },
        404: {
            title: "Not Found",
            message: "The requested resource could not be found.",
            icon: "lucide:file-question"
        }
    };

    function isValidHttpStatus(status: number): status is keyof typeof httpStatusMessages {
        return status in httpStatusMessages;
    }
</script>

<main class="fixed inset-0 flex flex-col items-center justify-center">
    <div class="text-center">
        <div class="flex justify-center mb-4">
            <Icon class="size-24" icon={`${isValidHttpStatus(page.status) ? httpStatusMessages[page.status].icon : "mdi:alert-circle-outline"}`} />
        </div>
        <h1 class="text-4xl font-bold mb-2">{isValidHttpStatus(page.status) ? httpStatusMessages[page.status].title : "Unknown Error"}</h1>
        <p class="text-lg text-zinc-400">
            {isValidHttpStatus(page.status) ? httpStatusMessages[page.status].message : page.error?.message || "An unexpected error occurred."}
        </p>
    </div>
</main>
