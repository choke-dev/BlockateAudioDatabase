<script lang="ts">
	import * as Table from '$lib/components/ui/table/index';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import LucideCircleAlert from '~icons/lucide/circle-alert';

	import LucideSearch from '~icons/lucide/search';
	import LucideLoaderCircle from '~icons/lucide/loader-circle';

	import type { Audio } from '@prisma/client';
	import { onMount } from 'svelte';
	import { MAX_SEARCH_RESULTS_PER_PAGE } from '$lib/config';
	import SearchFilter from '$lib/components/ui/custom/SearchFilter.svelte';

	let errors = $state<{ message: string }[]>([]);
	let searchResults: Audio[] = $state([]);
	let loading = $state(false);

	let started = $state(false);
	let keyword = $state('');
	let currentPage = $state(1); // Track current page
	// svelte-ignore non_reactive_update
	let totalItems = $state(0); // Total number of items (total audios found)
	let filters = $state<{ label: string; value: string; inputValue: string }[]>([]);

	async function handleSearch(event?: Event) {
		started = true;

		loading = true;
        errors = []
		searchResults = [];
		if (event && event.target instanceof HTMLFormElement) {
			const formData = new FormData(event.target as HTMLFormElement);
			keyword = formData.get('keyword') as string;
		}
		const response = await fetch(`/?keyword=${encodeURIComponent(keyword)}&page=${currentPage}`, {
			method: 'POST',
			body: JSON.stringify(filters)
		});
		if (!response.ok) {
			const data = await response.json();
			errors = data.errors;
			loading = false;
			return;
		}
		const data = await response.json();
		console.log(data?.errors);
		searchResults = data.items; // Assuming the response includes a `items` field with the audios
		totalItems = data.total; // Assuming the response includes a `total` field with the total number of audios
		loading = false;
	}

	async function handlePageChange(page: number, event?: Event) {
		currentPage = page;
		await handleSearch(event);
	}

	async function handleFilterChange(
		filter: { label: string; value: string; inputValue: string }[]
	) {
		filters = filter;
		currentPage = 1;
		await handleSearch();
	}

	onMount(async () => {
		const url = new URL(location.href);
		const keywordParam = url.searchParams.get('keyword');
		if (keywordParam !== null && keywordParam.length > 0) {
			keyword = keywordParam;
		}
		handleSearch();
	});
</script>

<svelte:head>
	<title>Blockate Audio Database</title>
</svelte:head>

{#if errors.length > 0}
    <div class={`mb-8 flex items-center justify-center ${ errors.length > 0 ? 'mt-4' : '' }`}>
        {#each errors as error}
            <div class="w-[75%] rounded-lg bg-[#3b0703]">
                <div class="flex p-4 font-poppins text-[#fab4af]">
                    <div class="mr-3 flex flex-col">
                        <LucideCircleAlert class="h-6" />
                    </div>
                    <div>
                        <h1 class="font-bold">Error</h1>
                        <p>{error.message}</p>
                    </div>
                </div>
            </div>
        {/each}
    </div>
{/if}

<div class="mx-auto flex w-full max-w-[75%] items-center">
	<div class={`relative mx-auto mb-8 flex w-full items-center justify-between gap-x-2 ${ errors.length > 0 ? '' : 'mt-32' }`}>
		<form onsubmit={handleSearch} class="flex w-full max-w-lg items-center gap-x-2">
			<div class="flex flex-grow items-center gap-x-2">
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


<div class="mb-32 flex items-center justify-center">
	<div class="relative z-[1] w-full max-w-[75%]">
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
							<a
								class="underline underline-offset-2 transition-colors duration-200 hover:text-white"
								href={`https://www.roblox.com/users/${audio.whitelisterUserId}/profile`}
							>
								{audio.whitelisterName}
							</a>
						</Table.Head>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		{#if started && !loading && searchResults.length === 0 && errors.length === 0}
			<div class="mt-4 flex items-center justify-center">No results found.</div>
		{/if}

		<!-- Pagination Component -->
		<Pagination.Root class="mt-8" count={totalItems} perPage={MAX_SEARCH_RESULTS_PER_PAGE}>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton onclick={(event) => handlePageChange(currentPage - 1)} />
					</Pagination.Item>

					{#each pages as page (page.key)}
						{#if page.type === 'ellipsis'}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link
									{page}
									isActive={currentPage === page.value}
									onclick={(event) => handlePageChange(page.value)}
								>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}

					<Pagination.Item>
						<Pagination.NextButton onclick={(event) => handlePageChange(currentPage + 1)} />
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
	</div>
</div>
