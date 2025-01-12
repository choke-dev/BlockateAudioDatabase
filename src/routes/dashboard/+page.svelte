<script lang="ts">
	import { Skeleton } from "$lib/components/ui/skeleton";
	import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Blockate Audio Database - Dashboard</title> 
</svelte:head>

<div class="flex items-center justify-center mt-4 font-poppins">
    <p class="text-orange-500">The dashboard is currently in development, this will allow you to add whitelisted audios to the database soon.</p>
</div>

<div class="flex items-center justify-start mt-32 mx-32">
    <div class="flex flex-col items-center justify-start">
        <div>
            <h1 class="text-left text-7xl font-poppins">Welcome, <span class="font-bold">{data.name}</span></h1>
            <p class="mt-2 text-neutral-700 font-poppins">What would you like to do today?</p>
        </div>
    </div>
    
</div>