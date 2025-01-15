<script lang="ts">
    import LogosDiscordIcon from '~icons/logos/discord-icon';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';
    
	import { Button } from '$lib/components/ui/button';

    let loading = $state(false);
    async function login() {
        loading = true;
        const response = await fetch('/api/oauth/discord/login', { method: 'POST' })
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
            <LogosDiscordIcon /> Login with Discord
        {/if}
    </Button>
</div>