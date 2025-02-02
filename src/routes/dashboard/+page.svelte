<script lang="ts">
    import type { PageData } from "./$types";
	import DatabaseManagementActions from "$lib/components/ui/custom/dashboard/DatabaseManagementActions.svelte";
	import RequestAudioWhitelist from "$lib/components/ui/custom/dashboard/RequestAudioWhitelist.svelte";
	import ViewAudioWhitelistRequests from "$lib/components/ui/custom/dashboard/ViewAudioWhitelistRequests.svelte";

    let { data }: { data: PageData } = $props();
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
        
        {#if data.permissionLevel >= 3}
            <div class="p-5 border rounded-lg mt-6 relative">
                <h1 class="absolute -top-4 left-4 p-1 rounded"><span class="bg-background px-1">Database Management</span></h1>
                <DatabaseManagementActions />
            </div>
        {/if}

        
        <div class="p-5 border rounded-lg flex gap-x-2 mt-6 relative">
            <div class="absolute -top-4 left-4 flex items-center gap-x-2 p-1 rounded">
                <h1>Audio Whitelisting</h1>
                <p class="text-yellow-500">BETA</p>
            </div>
            <RequestAudioWhitelist />
            {#if data.permissionLevel >= 1}
                <ViewAudioWhitelistRequests />
            {/if}
        </div>
        
    </div>
</div>