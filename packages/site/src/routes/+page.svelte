<script lang="ts">
	import ErrorDisplay from '$lib/components/ui/custom/ErrorDisplay.svelte';
	import SearchForm from '$lib/components/ui/custom/SearchForm.svelte';
	import SearchResults from '$lib/components/ui/custom/SearchResults.svelte';
	import type { Audios } from '@prisma/client';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let errors = $state<{ message: string }[]>([]);
	let searchResults: Audios[] = $state([]);
	let loading = $state(false);
	let currentlyPlayingId = $state<string | null>(null);
	let lastPlayedAudioId = $state<string | null>(null);
	let loadingAudioId = $state<string | null>(null);
	let downloadProgress = $state<Record<string, number>>({});
	let audioElement: HTMLAudioElement;
	let prefetchedAudioUrls = $state<Record<string, string>>({});
	let prefetchingAudio = $state(false);
	let audioBlobs = $state<Record<string, Blob>>({});
	let audioBlobUrls = $state<Record<string, string>>({});
	
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
        errors = [];
		searchResults = [];
		audioElement.pause();
		currentlyPlayingId = null;
		lastPlayedAudioId = null;

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
			totalItems = 0;
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

		const queryParams = new URLSearchParams();
		if (lastSearchKeyword.length > 0) {
			queryParams.set('keyword', encodeURIComponent(lastSearchKeyword));
		}
		queryParams.set('page', currentPage.toString());
		
		const response = await fetch(`/api/audio/search?${queryParams.toString()}`, {
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
			
			// Filter out audio IDs that are already in blob storage or cached
			const uncachedAudioIds = audioIds.filter(id => !audioBlobs[String(id)] && !cachedUrls[String(id)]);
			
			if (uncachedAudioIds.length === 0) {
				// All audio URLs are already cached or stored as blobs
				prefetchingAudio = false;
				return;
			}
			
			// Fetch only uncached audio URLs
			const response = await fetch('/api/audio/preview', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(uncachedAudioIds.map(id => id.toString()))
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
			
			// Prefetch audio blobs in the background
			// We're not awaiting this to avoid blocking the UI
			Promise.all(
				Object.entries(newAudioUrls).map(async ([id, url]) => {
					try {
						// Skip if we already have this blob
						if (audioBlobs[id]) return;
						
						// Fetch the audio as a blob
						const audioResponse = await fetch(url as string);
						if (!audioResponse.ok) return;
						
						// Get the blob from the response
						const audioBlob = await audioResponse.blob();
						
						// Store the blob for future use
						audioBlobs = { ...audioBlobs, [id]: audioBlob };
						
						// Create and store a blob URL
						const blobUrl = URL.createObjectURL(audioBlob);
						audioBlobUrls = { ...audioBlobUrls, [id]: blobUrl };
					} catch (error) {
						console.error(`Error prefetching audio blob for ID ${id}:`, error);
					}
				})
			).catch(error => {
				console.error('Error in blob prefetching:', error);
			});
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
			audioElement.currentTime = 0;
			currentlyPlayingId = null;
			// Keep track of the last played audio
			lastPlayedAudioId = audioId;
			return;
		}
		
		// If this is the same audio that was last played and it's paused, just resume
		if (lastPlayedAudioId === audioId && audioElement.paused && audioElement.src) {
			audioElement.play();
			currentlyPlayingId = audioId;
			return;
		}

		try {
			// Show loading state for this specific audio ID
			loadingAudioId = audioId;
			
			// Check if we already have the audio blob
			if (audioBlobs[audioId]) {
				// Check if we already have a blob URL for this audio
				let blobUrl = audioBlobUrls[audioId];
				
				// If not, create one and store it
				if (!blobUrl) {
					blobUrl = URL.createObjectURL(audioBlobs[audioId]);
					audioBlobUrls = { ...audioBlobUrls, [audioId]: blobUrl };
				}
				
				audioElement.src = blobUrl;
				audioElement.play();
				loadingAudioId = null;
				currentlyPlayingId = audioId;
				lastPlayedAudioId = audioId;
				
				// When audio ends, reset the playing state
				audioElement.onended = () => {
					currentlyPlayingId = null;
				};
				return;
			}
			
			// Check cache for URL
			const cachedUrls = loadFromCache();
			
			// Use prefetched URL if available, otherwise fetch it
			// Find the audio object in searchResults by matching the ID
			const audioObject = searchResults.find(audio => String(audio.id) === audioId);
			let audioUrl = prefetchedAudioUrls[audioId] || cachedUrls[audioId] || audioObject?.audio_url;
			
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
			
			// Initialize progress for this audio
			downloadProgress = { ...downloadProgress, [audioId]: 0 };
			
			// Fetch the audio with progress tracking
			let response = await fetch(audioUrl)
				.catch(error => error); // lol
			
			// If the audio fails to load and we haven't tried the API yet, try fetching from API
			if (!response.ok) {
				// Check if we were using a direct audioUrl from the audio object
				const wasUsingDirectUrl = audioObject?.audio_url === audioUrl;
				
				if (wasUsingDirectUrl) {
					// Try to fetch a new URL from the API
					console.warn(`Direct audioUrl failed for ${audioId}, contacting API for a valid URL...`);
					try {
						const apiResponse = await fetch('/api/audio/preview', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify([audioId])
						});
						
						if (apiResponse.ok) {
							const audioUrls = await apiResponse.json();
							const newAudioUrl = audioUrls[audioId];
							
							if (newAudioUrl && newAudioUrl !== audioUrl) {
								// Update cache with the new URL
								const updatedCache = { ...cachedUrls, [audioId]: newAudioUrl };
								prefetchedAudioUrls = updatedCache;
								saveToCache(updatedCache);
								
								// Try again with the new URL
								audioUrl = newAudioUrl;
								// Ensure audioUrl is not null before fetching
								if (audioUrl) {
									response = await fetch(audioUrl);
								} else {
									throw new Error("New audio URL is null");
								}
								
								// If still not ok, show error
								if (!response.ok) {
									errors = [{ message: 'Failed to load audio data even after API refresh' }];
									loadingAudioId = null;
									currentlyPlayingId = null;
									downloadProgress = { ...downloadProgress, [audioId]: 0 };
									return;
								}
							} else {
								// API didn't return a new URL or returned the same one
								errors = [{ message: 'Failed to load audio data' }];
								loadingAudioId = null;
								currentlyPlayingId = null;
								downloadProgress = { ...downloadProgress, [audioId]: 0 };
								return;
							}
						} else {
							// API call failed
							errors = [{ message: 'Failed to load audio data and API refresh failed' }];
							loadingAudioId = null;
							currentlyPlayingId = null;
							downloadProgress = { ...downloadProgress, [audioId]: 0 };
							return;
						}
					} catch (error) {
						console.error('Error fetching from API:', error);
						errors = [{ message: 'Failed to load audio data' }];
						loadingAudioId = null;
						currentlyPlayingId = null;
						downloadProgress = { ...downloadProgress, [audioId]: 0 };
						return;
					}
				} else {
					// We weren't using a direct URL, so just show the error
					errors = [{ message: 'Failed to load audio data' }];
					loadingAudioId = null;
					currentlyPlayingId = null;
					downloadProgress = { ...downloadProgress, [audioId]: 0 };
					return;
				}
			}
			
			// Get content length for progress calculation
			const contentLength = response.headers.get('content-length');
			const total = contentLength ? parseInt(contentLength, 10) : 0;
			
			let audioBlob: Blob;
			
			// Read the response as a stream if content length is available
			if (total > 0 && response.body) {
				const reader = response.body.getReader();
				let receivedLength = 0;
				const chunks: Uint8Array[] = [];
				
				while (true) {
					const { done, value } = await reader.read();
					
					if (done) {
						break;
					}
					
					chunks.push(value);
					receivedLength += value.length;
					
					// Update progress (0-100)
					const progress = Math.min(Math.round((receivedLength / total) * 100), 100);
					downloadProgress = { ...downloadProgress, [audioId]: progress };
				}
				
				// Combine all chunks into a single Uint8Array
				const chunksAll = new Uint8Array(receivedLength);
				let position = 0;
				for (const chunk of chunks) {
					chunksAll.set(chunk, position);
					position += chunk.length;
				}
				
				// Create a blob from the bytes
				audioBlob = new Blob([chunksAll]);
			} else {
				// Fallback if streaming not supported or content length unknown
				audioBlob = await response.blob();
				downloadProgress = { ...downloadProgress, [audioId]: 100 }; // Set to 100% when done
			}
			
			// Store the blob for future use
			audioBlobs = { ...audioBlobs, [audioId]: audioBlob };
			
			// Create a URL for the blob and store it
			const blobUrl = URL.createObjectURL(audioBlob);
			audioBlobUrls = { ...audioBlobUrls, [audioId]: blobUrl };
			audioElement.src = blobUrl;
			audioElement.play();
			loadingAudioId = null;
			currentlyPlayingId = audioId;
			lastPlayedAudioId = audioId;
			
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
	
	// Clean up blob URLs when component is destroyed
	onDestroy(() => {
		// Revoke all blob URLs to prevent memory leaks
		Object.values(audioBlobUrls).forEach(blobUrl => {
			if (blobUrl && blobUrl.startsWith('blob:')) {
				URL.revokeObjectURL(blobUrl);
			}
		});
		
		// Also revoke the current audio element src if it's a blob
		if (audioElement && audioElement.src && audioElement.src.startsWith('blob:')) {
			URL.revokeObjectURL(audioElement.src);
		}
		
		// Clear the audio element
		if (audioElement) {
			audioElement.pause();
			audioElement.src = '';
		}
	});
</script>

<svelte:head>
	<title>Blockate Audio Browser</title>
</svelte:head>

<ErrorDisplay {errors} />

<SearchForm
	bind:keyword
	{lastSearchKeyword}
	{loading}
	onSubmit={handleSearch}
	onFilterChange={handleFilterChange}
	onSortChange={handleSortChange}
	hasErrors={errors.length > 0}
/>


<SearchResults
	{started}
	{loading}
	{searchResults}
	{totalItems}
	{currentPage}
	{currentlyPlayingId}
	{loadingAudioId}
	{downloadProgress}
	{prefetchingAudio}
	onPlayAudio={playAudio}
	onPageChange={handlePageChange}
/>

<!-- Hidden audio element for playback -->
<audio bind:this={audioElement} class="hidden"></audio>
