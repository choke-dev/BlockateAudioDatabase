<script lang="ts">
    import SimpleIconsRoblox from '~icons/simple-icons/roblox';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';
    
	import { Button } from '$lib/components/ui/button';
    import { auth } from '$lib/stores/auth.js';

    let loading = $state(false);
    
    async function login() {
        loading = true;
        try {
            await auth.login();
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            loading = false;
        } 
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