<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import * as Table from '$lib/components/ui/table/index';
	
	import LucideCircleAlert from '~icons/lucide/circle-alert';
	import LucideLoaderCircle from '~icons/lucide/loader-circle';
	import LucideSearch from '~icons/lucide/search';
	import LucideX from '~icons/lucide/x';
	import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';
	import MaterialSymbolsPauseRounded from '~icons/material-symbols/pause-rounded';
	import LucideArrowRight from '~icons/lucide/arrow-right';

	import SearchFilter from '$lib/components/ui/custom/SearchFilter.svelte';
	import SearchSort from '$lib/components/ui/custom/SearchSort.svelte'; 
	import { MAX_SEARCH_RESULTS_PER_PAGE } from '$lib/config/search';
	import type { Audio } from '@prisma/client';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { buildWhitelisterUrl } from '$lib/whitelister';
	import { browser } from '$app/environment';

	let errors = $state<{ message: string }[]>([]);
	let searchResults: Audio[] = $state([]);
	let loading = $state(false);
	let currentlyPlayingId = $state<string | null>(null);
	let loadingAudioId = $state<string | null>(null);
	let audioElement: HTMLAudioElement;
	let prefetchedAudioUrls = $state<Record<string, string>>({});
	let prefetchingAudio = $state(false);
	
	// Cache configuration
	const AUDIO_CACHE_KEY = 'blockate-audio-urls-cache';
	const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

	let started = $state(false);
	let lastSearchKeyword = $state('');
	let keyword = $state('');
	let currentPage = $state(1); // Track current page
	let totalItems = $state(0); // Total number of items (total audios found)
	let filters = $state<{ filters: { label: string; value: string; inputValue: string }[], type: 'and' | 'or' }>({ filters: [], type: 'and' });
	let sort = $state<{ field: string, order: 'asc' | 'desc' } | null>(null);

	async function handleSearch(event?: Event) {
		event?.preventDefault();

		started = true;
		loading = true;
        errors = []
		searchResults = [];
		audioElement.pause();
		currentlyPlayingId = null;

		if (event && event.target instanceof HTMLFormElement) {
			const formData = new FormData(event.target);
			const formKeyword = formData.get('keyword');
			if (formKeyword) {
				keyword = formKeyword.toString();
			} else {
				keyword = '';
			}
		}
		
		// Reset page to 1 if keyword has changed
		if (keyword.toLowerCase() !== lastSearchKeyword.toLowerCase()) {
			currentPage = 1;
		}
		
		let query: URLSearchParams | undefined = new URLSearchParams(page.url.searchParams.toString());
		if (keyword.length <= 0) {
			query.delete('keyword');
		} else {
			query.set('keyword', keyword);
		}
		
		// Set page parameter only if not on page 1
		if (currentPage !== 1) {
			query.set('page', currentPage.toString());
		} else {
			query.delete('page');
		}
		
		goto(`?${query.toString()}`);
		query = undefined;

		lastSearchKeyword = keyword;
		const response = await fetch(`/api/audio/search?keyword=${encodeURIComponent(lastSearchKeyword)}&page=${currentPage}`, {
			method: 'POST',
			body: JSON.stringify({
				filters,
				sort
			}),
		});
		if (!response.ok) {
			const data = await response.json();
			errors = data.errors;
			loading = false;
			return;
		}
		const data = await response.json();
		searchResults = data.items; // Assuming the response includes a `items` field with the audios
		totalItems = data.total; // Assuming the response includes a `total` field with the total number of audios
		loading = false;
		
		// Prefetch audio URLs after search results are loaded
		// prefetchAudioUrls();
	}

	async function handlePageChange(page: number, event?: Event) {
		currentPage = page;
		await handleSearch(event);
	}

	async function handleFilterChange(
		filter: { filters: { label: string; value: string; inputValue: string }[], type: 'and' | 'or' },
	) {
		filters = filter;
		currentPage = 1;
		await handleSearch();
	}

	async function handleSortChange(
		sortOption: { field: string, order: 'asc' | 'desc' } | null,
	) {
		sort = sortOption;
		currentPage = 1;
		await handleSearch();
	}

	// Helper function to save audio URLs to localStorage
	function saveToCache(audioUrls: Record<string, string>) {
		if (!browser) return;
		
		try {
			const cacheData = {
				urls: audioUrls,
				timestamp: Date.now()
			};
			localStorage.setItem(AUDIO_CACHE_KEY, JSON.stringify(cacheData));
		} catch (error) {
			console.error('Error saving audio URLs to cache:', error);
		}
	}
	
	// Helper function to load audio URLs from localStorage
	function loadFromCache(): Record<string, string> {
		if (!browser) return {};
		
		try {
			const cachedData = localStorage.getItem(AUDIO_CACHE_KEY);
			if (!cachedData) return {};
			
			const parsedData = JSON.parse(cachedData);
			
			// Check if cache has expired
			if (Date.now() - parsedData.timestamp > CACHE_EXPIRY_TIME) {
				localStorage.removeItem(AUDIO_CACHE_KEY);
				return {};
			}
			
			return parsedData.urls || {};
		} catch (error) {
			console.error('Error loading audio URLs from cache:', error);
			return {};
		}
	}
	
	// Function to prefetch all audio URLs for the current search results
	async function prefetchAudioUrls() {
		if (searchResults.length === 0) return;
		
		try {
			prefetchingAudio = true;
			
			// Get all audio IDs from search results
			const audioIds = searchResults.map(audio => audio.id);
			
			// Check which audio IDs are already cached
			const cachedUrls = loadFromCache();
			prefetchedAudioUrls = cachedUrls;
			
			// Filter out audio IDs that are already cached and not expired
			const uncachedAudioIds = audioIds.filter(id => !cachedUrls[id]);
			
			if (uncachedAudioIds.length === 0) {
				// All audio URLs are already cached
				prefetchingAudio = false;
				return;
			}
			
			// Fetch only uncached audio URLs
			const response = await fetch('/api/audio/preview', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(uncachedAudioIds)
			});
			
			if (!response.ok) {
				console.error('Failed to prefetch audio URLs');
				prefetchingAudio = false;
				return;
			}
			
			// Store the newly fetched URLs
			const newAudioUrls = await response.json();
			
			// Merge with existing cached URLs
			const mergedUrls = { ...cachedUrls, ...newAudioUrls };
			prefetchedAudioUrls = mergedUrls;
			
			// Update the cache
			saveToCache(mergedUrls);
		} catch (error) {
			console.error('Error prefetching audio URLs:', error);
		} finally {
			prefetchingAudio = false;
		}
	}

	async function playAudio(audioId: string) {
		if (currentlyPlayingId === audioId) {
			// If the same audio is already playing, pause it
			audioElement.pause();
			currentlyPlayingId = null;
			return;
		}

		try {
			// Show loading state for this specific audio ID
			loadingAudioId = audioId;
			
			// Check cache first
			const cachedUrls = loadFromCache();
			
			// Use prefetched URL if available, otherwise fetch it
			let audioUrl = prefetchedAudioUrls[audioId] || cachedUrls[audioId] || searchResults[Number(audioId)]?.audioUrl;
			
			if (!audioUrl) {
				// Fetch the audio URL from the API if not cached
				const response = await fetch('/api/audio/preview', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify([audioId])
				});
				
				if (!response.ok) {
					const errorData = await response.json();
					errors = errorData.errors || [{ message: 'Failed to load audio' }];
					loadingAudioId = null;
					currentlyPlayingId = null;
					return;
				}
				
				const audioUrls = await response.json();
				audioUrl = audioUrls[audioId];
				
				if (audioUrl) {
					// Update cache with the new URL
					const updatedCache = { ...cachedUrls, [audioId]: audioUrl };
					prefetchedAudioUrls = updatedCache;
					saveToCache(updatedCache);
				}
			}
			
			if (!audioUrl) {
				errors = [{ message: 'Audio URL not found' }];
				loadingAudioId = null;
				currentlyPlayingId = null;
				return;
			}
			
			// Set the audio source and play
			audioElement.src = audioUrl;
			audioElement.play();
			loadingAudioId = null;
			currentlyPlayingId = audioId;
			
			// When audio ends, reset the playing state
			audioElement.onended = () => {
				currentlyPlayingId = null;
			};
		} catch (error) {
			console.error('Error playing audio:', error);
			errors = [{ message: 'An error occurred while playing audio' }];
			loadingAudioId = null;
			currentlyPlayingId = null;
		}
	}

	// Load cached audio URLs on component mount
	onMount(async () => {
		// Load cached URLs
		if (browser) {
			const cachedUrls = loadFromCache();
			prefetchedAudioUrls = cachedUrls;
		}
		const url = new URL(location.href);
		const keywordParam = url.searchParams.get('keyword');
		if (keywordParam !== null && keywordParam.length > 0) {
			keyword = keywordParam;
		}
		
		// Check for page parameter in URL
		const pageParam = url.searchParams.get('page');
		if (pageParam !== null && !isNaN(parseInt(pageParam))) {
			currentPage = parseInt(pageParam);
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
				<div class="flex relative flex-grow">
					<Input bind:value={keyword} name="keyword" placeholder="Search..." class="w-full pr-10" />
					{#if lastSearchKeyword.length > 0}
						<Button 
						variant="ghost" 
						size="icon"
						class="absolute right-0 top-0 h-full rounded-none rounded-br-lg rounded-tr-lg"
						onclick={() => {
							keyword = ''
							handleSearch()
						}}
						>
							<LucideX />
						</Button>
					{/if}
				</div>
				<Button size="icon" type="submit" disabled={loading} class="flex-none">
					{#if loading}
						<LucideLoaderCircle class="animate-spin" />
					{:else}
						<LucideSearch />
					{/if}
				</Button>
			</div>
		</form>
		<div class="flex gap-2">
			<SearchFilter updateFilters={handleFilterChange} />
			<SearchSort updateSort={handleSortChange} />
		</div>
	</div>
</div>


<div class="mb-32 mx-auto max-w-[75%] flex flex-col items-center justify-center relative">
	<div class="w-full absolute -top-0 left-0">
    {#if started && !loading}
        <p class="text-zinc-500">
   Fetched {searchResults.length} audio{Math.abs(searchResults.length) === 1 ? '' : 's'}
   {#if prefetchingAudio}
    <span class="ml-2 inline-flex items-center text-xs">
    	<LucideLoaderCircle class="mr-1 h-3 w-3 animate-spin" />
    	Prefetching audio...
    </span>
   {/if}
  </p>
    {/if}
	</div>
	<div class="w-full mt-6">
		<Table.Root class="rounded-lg border backdrop-blur-sm">
			<Table.Header class="rounded-lg">
				<Table.Row>
					<Table.Head class="w-[200px]">Audio ID</Table.Head>
					<Table.Head>Name</Table.Head>
					<Table.Head>Category</Table.Head>
					<Table.Head class="text-right">Whitelister</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each searchResults as audio}
					<Table.Row>
						<Table.Head class="w-[200px]">
							<div class="flex items-center gap-2">
								{#if audio.version === 2}
								<button
									class={`flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors ${currentlyPlayingId === audio.id ? 'bg-white text-black hover:bg-white/80' : ''}`}
									onclick={() => playAudio(audio.id)}
									aria-label={currentlyPlayingId === audio.id ? "Pause audio" : "Play audio"}
								>
									{#if loadingAudioId === audio.id}
										<LucideLoaderCircle class="h-4 w-4 animate-spin" />
									{:else if currentlyPlayingId === audio.id}
										<MaterialSymbolsPauseRounded class="size-6" />
									{:else}
										<MaterialSymbolsPlayArrowRounded class="size-6" />
									{/if}
								</button>
								{/if}
								{audio.id}
							</div>
						</Table.Head>
						<Table.Head>{audio.name}</Table.Head>
						<Table.Head>{audio.category}</Table.Head>
						<Table.Head class="text-right">
							<a
								class="underline underline-offset-2 transition-colors duration-200 hover:text-white"
								href={buildWhitelisterUrl(audio.whitelisterType, audio.whitelisterUserId)}
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
		<Pagination.Root class="mt-8" count={totalItems} perPage={MAX_SEARCH_RESULTS_PER_PAGE} bind:page={currentPage}>
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
		
		<!-- Page selector -->
		<div class="mt-4 flex items-center justify-center gap-2">
			<span class="text-sm text-zinc-400">Go to page:</span>
			<form
				class="flex items-center gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const pageInput = formData.get('pageInput');
					const pageNumber = pageInput ? parseInt(pageInput.toString()) : null;
					if (
						pageNumber &&
						!isNaN(pageNumber) &&
						pageNumber > 0 &&
						pageNumber <= Math.ceil(totalItems / MAX_SEARCH_RESULTS_PER_PAGE)
					) {
						handlePageChange(pageNumber);
						// Clear page input
						e.currentTarget.reset();
					}
				}}
			>
				<Input
					name="pageInput"
					class="w-16 text-center"
					placeholder=""
				/>
				<Button type="submit" size="icon"> <LucideArrowRight class="size-8" /> </Button>
			</form>
		</div>
	</div>
</div>

<!-- Hidden audio element for playback -->
<audio bind:this={audioElement} class="hidden"></audio>

