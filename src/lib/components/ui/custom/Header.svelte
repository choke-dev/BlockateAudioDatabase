<script lang="ts">
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button";

	import UserActions from "$lib/components/ui/custom/UserActions.svelte";
  
  // Icons
  import LucideMenu from '~icons/lucide/menu';
	import LoginWithProvider from "./LoginWithProvider.svelte";
	import { page } from "$app/state";

  const getUserSession = async (): Promise<{ success: boolean; data: any }> => {
    return await fetch("/api/session", { credentials: "same-origin" }).then((response) => response.json()).catch(() => ({ success: false, data: null }));
  }
</script>

<header class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-y backdrop-blur">
  <div class="container flex h-14 max-w-screen-2xl items-center justify-between">
    
    <div class="flex-shrink-0">
      <a href="/">
        <img
        src="/BlockateAudioDatabaseLogo.png"
        alt="Blockate Audio Database Logo"
        class="hidden md:block w-55 h-8"
      />
      </a>
    </div>

    <div class="absolute items-center left-1/2 transform -translate-x-1/2">
      <a href="/">
        <img
        src="/BlockateAudioDatabaseLogo.png"
        alt="Blockate Audio Database Logo"
        class="block md:hidden w-8 h-8"
        />
      </a>
    </div>

    <div class="flex items-center">
      <div class="hidden md:flex gap-x-3">
        {#await getUserSession()}
          <!--  -->
        {:then userSession}
          {#if userSession.success}
            <UserActions data={userSession.data} />
          {:else}
            <LoginWithProvider />
          {/if}
        {/await}
      </div>

      <Sheet.Root>
        <Sheet.Trigger> <LucideMenu class="size-8 md:hidden" /> </Sheet.Trigger>
        <Sheet.Content class="flex flex-col justify-end" side="right">
          <Sheet.Header />

          <div class="flex flex-col gap-y-2 items-center">
            {#await getUserSession()}
              <!--  -->
            {:then userSession}
              {#if userSession.success}
                <UserActions data={userSession.data} />
              {:else}
                <LoginWithProvider />
              {/if}
            {/await}
          </div>

        </Sheet.Content>
      </Sheet.Root>
    </div>
  </div>
</header>
