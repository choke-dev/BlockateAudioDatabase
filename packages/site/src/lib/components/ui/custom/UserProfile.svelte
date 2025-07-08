<script lang="ts">
    import { auth } from '$lib/stores/auth.js';
    import { Button } from '$lib/components/ui/button';
    import LucideUser from '~icons/lucide/user';
    import LucideLogOut from '~icons/lucide/log-out';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';

    let { user } = $props();

    let loading = $state(false);

    async function handleLogout() {
        loading = true;
        try {
            await auth.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex items-center gap-2">
    <div class="flex items-center gap-2">
        {#if user.avatar}
            <img
                src={user.avatar}
                alt={user.username}
                class="h-8 w-8 rounded-full"
            />
        {:else}
            <LucideUser class="h-6 w-6" />
        {/if}
        <span class="hidden md:inline text-sm font-medium">@{user.username}</span>
    </div>
    
    <Button variant="outline" size="sm" onclick={loading ? null : handleLogout} class="flex items-center gap-1" disabled={loading}>
        {#if loading}
            <LucideLoaderCircle class="h-4 w-4 animate-spin" />
        {:else}
            <LucideLogOut class="h-4 w-4" />
        {/if}
        <span class="hidden md:inline">{loading ? 'Logging out...' : 'Logout'}</span>
    </Button>
</div>