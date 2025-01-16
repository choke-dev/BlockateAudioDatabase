<script lang="ts">
	import { Button } from "$lib/components/ui/button";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import type { User } from "@prisma/client";

    let { data }: { data: User } = $props();

    async function logout() {
        const response = await fetch('/api/oauth/discord/logout', { method: 'POST' })
        if (!response.ok) return;
        window.location.href = (await response.json()).data
    }
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        <Button variant="ghost" class="flex items-center"> 
            <img class="rounded-full w-8" src={data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}` : 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={` `}>
            { data.username } 
        </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Group>
        <DropdownMenu.GroupHeading>My Account</DropdownMenu.GroupHeading>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={() => window.location.href = '/dashboard'}> Dashboard </DropdownMenu.Item>
        <DropdownMenu.Item onclick={logout}>Log out</DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>