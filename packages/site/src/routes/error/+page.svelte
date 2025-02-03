<script lang="ts">
	import { page } from "$app/state";

    const statusCodeTitles = {
        "400": "Bad Request",
        "404": "Not Found",
        "401": "Unauthorized",
        "403": "Forbidden",
        "500": "Internal Server Error"
    }

    function isValidStatusCode(status: string): status is keyof typeof statusCodeTitles {
        return status in statusCodeTitles;
    }
</script>

<div class="flex items-center justify-center min-h-screen">
    <h1>
        {#if isValidStatusCode(page.params.status)}
            {statusCodeTitles[page.params.status]}
        {:else}
            Unknown Error
        {/if}
    </h1>
    <p>{page.params?.message || "An unexpected error occurred."}</p>
</div>

