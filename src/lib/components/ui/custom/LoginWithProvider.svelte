<script lang="ts">
    import SimpleIconsRoblox from '~icons/simple-icons/roblox';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';
    
	import { Button } from '$lib/components/ui/button';

    let loading = $state(false);
    async function login() {
        loading = true;
        const response = await fetch('/api/oauth/roblox/login', { method: 'POST' })
        if (!response.ok) {loading = false;return;}
        window.location.href = (await response.json()).data
        loading = false;
    }
</script>

<div class="w-full">
    <Button class="w-full md:min-w-10" onclick={loading ? null : login} variant="outline" size={loading ? "icon" : "default"}>
        {#if loading}
            <LucideLoaderCircle class="animate-spin" />
        {:else}
            <SimpleIconsRoblox /> Login with Roblox
        {/if}
    </Button>
</div>