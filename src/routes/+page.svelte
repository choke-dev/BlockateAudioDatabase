<svelte:head>
    <title>Blockate Audio Database</title> 

    <meta name="theme-color" content="#df3877">
    <meta property="og:title" content="Blockate Audio Database">
    <meta property="og:description" content="A database aiming to record every whitelisted audio in Blockate">
    <meta property="og:image" content="/BlockateAudioDatabaseLogo.png" />
</svelte:head>

<script lang="ts">
    import * as Table from "$lib/components/ui/table/index.js";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Pagination from "$lib/components/ui/pagination/index";
    
    import LucideSearch from '~icons/lucide/search';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';
    import LucideExternalLink from '~icons/lucide/external-link';

	import type { Audio } from "@prisma/client";
	import { onMount } from "svelte";

    let searchResults: Audio[] = $state([]);
    let whitelistersData: { [key: number]: {"hasVerifiedBadge": true,"id": 0,"name": "string","displayName": "string"} } = $state({});
    let loading = $state(false);

    let keyword = $state('');
    let currentPage = $state(1);  // Track current page
    // svelte-ignore non_reactive_update
    let totalItems = $state(0);  // Total number of items (total audios found)
    const itemsPerPage = 100;  // Set items per page to 100

    async function handleSearch(event?: Event) {
        if (event) event.preventDefault();

        if (!keyword || keyword?.length === 0) return;

        loading = true;
        searchResults = [];
        const response = await fetch(`/?keyword=${encodeURIComponent(keyword)}&page=${currentPage}`);
        if (!response.ok) {
            loading = false;
            return;
        }
        const data = await response.json();

        searchResults = data.items;  // Assuming the response includes a `items` field with the audios
        totalItems = data.total;  // Assuming the response includes a `total` field with the total number of audios
        loading = false;
    }

    async function handlePageChange(page: number, event?: Event) {
        currentPage = page;
        await handleSearch(event);
    }

    onMount(async () => {
        const url = new URL(location.href);
        if (url.searchParams.has('keyword')) {
            keyword = url.searchParams.get('keyword')!;
            await handleSearch();
        }
    });

</script>

<div class="flex items-center justify-center gap-x-2 mx-auto mt-32 mb-8 max-w-md">
    <form onsubmit={handleSearch} class="w-full">
        <div class="flex items-center gap-x-2">
            <Input bind:value={keyword} name="keyword" placeholder="Search..." />
            <Button size="icon" type="submit" class="flex-none">
                {#if loading}
                    <LucideLoaderCircle class="animate-spin" />
                {:else}
                    <LucideSearch />
                {/if}
            </Button>
        </div>
    </form>
</div>

<div class="flex items-center justify-center mb-32">
    <div class="relative w-full max-w-[75%] z-[1]">
        <Table.Root class="rounded-lg border backdrop-blur-sm">
            <Table.Header class="rounded-lg">
                <Table.Row>
                    <Table.Head class="w-[150px]">Audio ID</Table.Head>
                    <Table.Head>Name</Table.Head>
                    <Table.Head>Category</Table.Head>
                    <Table.Head class="text-right">Whitelister</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each searchResults as audio}
                    <Table.Row>
                        <Table.Head class="w-[150px]">{audio.id}</Table.Head>
                        <Table.Head>{audio.name}</Table.Head>
                        <Table.Head>{audio.category}</Table.Head>
                        <Table.Head class="text-right">
                                <a class="hover:text-white hover:underline transition-colors duration-200" href={`https://www.roblox.com/users/${audio.uploaderUserId}/profile`}>
                                    {audio.uploaderName}
                                </a>
                        </Table.Head>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>

        <!-- Pagination Component -->
        <Pagination.Root class="mt-8" count={totalItems} perPage={itemsPerPage}>
            {#snippet children({ pages, currentPage })}
            <Pagination.Content>
                <Pagination.Item>
                    <Pagination.PrevButton onclick={ (event) => handlePageChange(currentPage - 1)} />
                </Pagination.Item>

                {#each pages as page (page.key)}
                    {#if page.type === "ellipsis"}
                        <Pagination.Item>
                            <Pagination.Ellipsis />
                        </Pagination.Item>
                    {:else}
                        <Pagination.Item> <!-- isVisible={currentPage === page.value} -->
                            <Pagination.Link {page} isActive={currentPage === page.value} onclick={ (event) => handlePageChange(page.value)}>
                                {page.value}
                            </Pagination.Link>
                        </Pagination.Item>
                    {/if}
                {/each}

                <Pagination.Item>
                    <Pagination.NextButton onclick={ (event) => handlePageChange(currentPage + 1)} />
                </Pagination.Item>
            </Pagination.Content>
            {/snippet}
        </Pagination.Root>
    </div>
</div>


