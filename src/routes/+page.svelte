<svelte:head>
    <title>Blockate Audio Database</title> 
</svelte:head>

<script lang="ts">
    import * as Table from "$lib/components/ui/table/index";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Pagination from "$lib/components/ui/pagination/index";
    
    import LucideSearch from '~icons/lucide/search';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';

	import type { Audio } from "@prisma/client";
	import { onMount } from "svelte";
	import { MAX_SEARCH_RESULTS_PER_PAGE } from "$lib/config";
	import SearchFilter from "$lib/components/ui/custom/SearchFilter.svelte";

    let searchResults: Audio[] = $state([]);
    let loading = $state(false);

    let started = $state(false);
    let keyword = $state('');
    let currentPage = $state(1);  // Track current page
    // svelte-ignore non_reactive_update
    let totalItems = $state(0);  // Total number of items (total audios found)
    let filters = $state<{ label: string, value: string, inputValue: string }[]>([]);

    async function handleSearch(event?: Event) {
        started = true;
        if (!keyword || keyword?.length === 0) return;

        loading = true;
        searchResults = [];
        const response = await fetch(`/?keyword=${encodeURIComponent(keyword)}&page=${currentPage}`, {
            method: "POST",
            body: JSON.stringify(filters)
        });
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

    async function handleFilterChange(filter: { label: string, value: string, inputValue: string }[]) {
        filters = filter
        currentPage = 1
        await handleSearch();
    }

    onMount(async () => {
        const url = new URL(location.href);
        if (url.searchParams.has('keyword')) {
            keyword = url.searchParams.get('keyword')!;
            await handleSearch();
        }
    });

</script>

<div class="flex items-center mx-auto max-w-[75%] w-full">
    <div class="flex items-center justify-between gap-x-2 mx-auto mt-32 mb-8 relative w-full">
        <form onsubmit={handleSearch} class="w-full flex items-center gap-x-2 max-w-lg">
            <div class="flex items-center gap-x-2 flex-grow">
                <Input bind:value={keyword} name="keyword" placeholder="Search..." class="flex-grow" />
                <Button size="icon" type="submit" disabled={loading} class="flex-none">
                    {#if loading}
                    <LucideLoaderCircle class="animate-spin" />
                    {:else}
                    <LucideSearch />
                    {/if}
                </Button>
            </div>
        </form>
        <SearchFilter updateFilters={handleFilterChange} />
    </div>
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
                            <a class="hover:text-white underline underline-offset-2 transition-colors duration-200" href={`https://www.roblox.com/users/${audio.uploaderUserId}/profile`}>
                                {audio.uploaderName}
                            </a>
                        </Table.Head>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>

        {#if started && !loading && searchResults.length === 0}
            <div class="mt-4 flex items-center justify-center">
                No results found.
            </div>
        {/if}

        <!-- Pagination Component -->
        <Pagination.Root class="mt-8" count={totalItems} perPage={MAX_SEARCH_RESULTS_PER_PAGE}>
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
                        <Pagination.Item>
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
