<script lang="ts">
    import type { PageData } from "./$types";
	import DatabaseManagementActions from "$lib/components/ui/custom/DatabaseManagementActions.svelte";

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
        
        <DatabaseManagementActions />
        
    </div>
</div>