<script lang="ts">
    import type { PageData } from "./$types";
	import DatabaseManagementActions from "$lib/components/ui/custom/dashboard/DatabaseManagementActions.svelte";
	import RequestAudioWhitelist from "$lib/components/ui/custom/dashboard/RequestAudioWhitelist.svelte";

    let { data }: { data: PageData } = $props();

    console.log(data)
</script>

<svelte:head>
<title>Blockate Audio Database - Dashboard</title> 
</svelte:head>

<div class="flex items-center justify-start mt-32 mx-32">
    <div class="flex flex-col  justify-start">
        <div>
            <h1 class="text-left text-7xl font-poppins">Welcome, <span class="font-bold">{data.username}</span></h1>
            <p class="mt-2 text-neutral-700 font-poppins">What would you like to do today?</p>
        </div>
        
        {#if data.permissionLevel >= 2}
            <div class="p-5 border rounded-lg mt-6 relative">
                <h1 class="absolute -top-4 left-4 p-1 rounded"><span class="bg-background px-1">Database Management</span></h1>
                <DatabaseManagementActions />
            </div>
        {/if}

        <RequestAudioWhitelist />
        
    </div>
</div>