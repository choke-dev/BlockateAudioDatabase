<script lang="ts">
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import SocialLinks from "./SocialLinks.svelte";
  import LoginWithProvider from "./LoginWithProvider.svelte";
  import UserProfile from "./UserProfile.svelte";
  import WhitelistRequestForm from "./WhitelistRequestForm.svelte";
  import WhitelistRequestsList from "./WhitelistRequestsList.svelte";
  import { auth } from '$lib/stores/auth.js';
  
  // Icons
  import LucideMenu from '~icons/lucide/menu';

  </script>

<header class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-y backdrop-blur">
  <div class="container flex h-14 max-w-screen-2xl items-center justify-between">
    
    <div class="flex-shrink-0 flex">
      <a href="/">
        <img
        src="/audiodb.png"
        alt="Blockate Audio Browser Logo"
        class="size-10"
      />
      </a>
    </div>

    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-x-3">        
        
        {#if $auth.authenticated && $auth.user}
          <WhitelistRequestForm />
          <WhitelistRequestsList />
          <div class="h-4 w-px bg-border"></div>
          <UserProfile user={$auth.user} />
        {:else if !$auth.loading}
          <LoginWithProvider />
        {/if}
      </div>

      <Sheet.Root>
        <Sheet.Trigger> <LucideMenu class="size-8 md:hidden" /> </Sheet.Trigger>
        <Sheet.Content class="flex flex-col justify-end" side="right">
          <Sheet.Header />

          <div class="flex flex-col gap-y-2 items-center">
            <SocialLinks />
            
            {#if $auth.authenticated && $auth.user}
              <WhitelistRequestForm />
              <WhitelistRequestsList />
              <UserProfile user={$auth.user} />
            {:else if !$auth.loading}
              <LoginWithProvider />
            {/if}
          </div>

        </Sheet.Content>
      </Sheet.Root>
    </div>
  </div>
</header>
