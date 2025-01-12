<script lang="ts">
	import { Button } from "$lib/components/ui/button";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

    let { data } = $props();

    async function logout() {
        const response = await fetch('/api/oauth/roblox/logout', { method: 'POST' })
        if (!response.ok) return;
        window.location.href = (await response.json()).data
    }
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        <Button variant="ghost" class="flex items-center"> 
            <img class="rounded-full w-8" src={data.picture} alt={`${data.name}'s avatar image'`}>
            { data.nickname.length > 0 ? `${data.nickname} (@${data.preferred_username})` : `@${data.preferred_username}` }
        </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Group>
        <DropdownMenu.GroupHeading>My Account</DropdownMenu.GroupHeading>
        <DropdownMenu.Separator />
        <DropdownMenu.Item> <a href="/dashboard">Dashboard</a> </DropdownMenu.Item>
        <DropdownMenu.Item onclick={logout}>Log out</DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>