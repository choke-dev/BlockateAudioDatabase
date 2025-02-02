<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { onMount } from 'svelte';
	import LucideCheck from '~icons/lucide/check';
	import LucideList from '~icons/lucide/list';
	import LucideLoaderCircle from '~icons/lucide/loader-circle';
	import LucideX from '~icons/lucide/x';
	import LucideRefreshCw from '~icons/lucide/refresh-cw';
	import LucidePlay from '~icons/lucide/play';
	import LucidePause from '~icons/lucide/pause';
	import Checkbox from '../../checkbox/checkbox.svelte';

	let loading = $state<{ [key: string]: boolean }>({
		fetchingRequests: false,
		submit: false
	});

	let errors = $state<{ [key: string]: string | null }>({}); // Track errors for each request

	type AudioRequest = {
		fileName: string;
		id: string;
		userId: string;
		fileURL: string;
		createdAt: Date;
	};

	let requests = $state<(AudioRequest & { isSelected: boolean })[]>([]);
	let selectAll = $state(false);
	let isSelectionMode = $state(false);

	// Single audio element state
	let audioElement: HTMLAudioElement;
	let currentlyPlayingId = $state<string | null>(null); // Track which request is currently playing
	let isPlaying = $state(false); // Track whether the audio is currently playing

	// Function to toggle play/pause for an audio request
	function togglePlayPause(requestId: string, fileURL: string) {
		if (!audioElement) {
			audioElement = new Audio(); // Initialize the audio element if it doesn't exist

			// Add event listeners to update the UI when the audio state changes
			audioElement.addEventListener('play', () => {
				isPlaying = true;
			});

			audioElement.addEventListener('pause', () => {
				isPlaying = false;
			});

			audioElement.addEventListener('ended', () => {
				isPlaying = false;
				currentlyPlayingId = null;
			});
		}

		if (currentlyPlayingId === requestId) {
			// If the same request is clicked, toggle play/pause
			if (audioElement.paused) {
				audioElement.play();
			} else {
				audioElement.pause();
			}
		} else {
			// If a different request is clicked, update the src and play
			audioElement.src = fileURL;
			audioElement.play();
			currentlyPlayingId = requestId;
		}
	}

	async function fetchRequests() {
		try {
			loading.fetchingRequests = true;
			const res = await fetch('/api/audio/requests');
			const data = await res.json();
			if (data.success) {
				requests = data.data.map((req: AudioRequest) => ({
					...req,
					isSelected: false
				}));
			}
			requests.forEach((element) => {
				loading[element.id] = false;
				loading[`${element.id}:accept`] = false;
				loading[`${element.id}:reject`] = false;
				errors[element.id] = null; // Reset errors when fetching new requests
			});
		} catch (error) {
			console.error('Error fetching requests:', error);
		} finally {
			loading.fetchingRequests = false;
		}
	}

	$effect(() => {
		const selectedCount = requests.filter((req) => req.isSelected).length;
		isSelectionMode = selectedCount > 0;
		selectAll = selectedCount === requests.length && requests.length > 0;
	});

	async function handleRequest(requestId: string, action: 'accept' | 'reject') {
		loading.submit = true;
		loading[requestId] = true;
		loading[`${requestId}:${action}`] = true;
		errors[requestId] = null; // Reset error state before making the request

		fetch(`/api/audio/requests/${requestId}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action })
		})
			.then(async (res) => {
				const data = await res.json();
				if (!data.success) {
					errors[requestId] = data.errors?.[0]?.message || 'An error occurred'; // Set error message
				} else {
					// Check if the request being removed is the one currently playing
					if (currentlyPlayingId === requestId) {
						audioElement.pause(); // Stop the audio
						currentlyPlayingId = null; // Reset the currently playing ID
						isPlaying = false; // Update the playing state
					}

					requests = requests.filter((request) => request.id !== requestId); // Remove the request if successful
				}
			})
			.catch((error) => {
				console.error(`Error ${action}ing request:`, error);
				errors[requestId] = 'An error occurred while processing the request.'; // Set error message
			})
			.finally(() => {
				loading.submit = false;
				loading[requestId] = false;
				loading[`${requestId}:${action}`] = false;
			});
	}

	async function handleBulkAction(action: 'accept' | 'reject') {
		const selectedIds = requests.filter((req) => req.isSelected).map((req) => req.id);
		for (const requestId of selectedIds) {
			await handleRequest(requestId, action);
		}
	}

	function toggleAllCheckboxes() {
		requests.forEach((request) => {
			request.isSelected = selectAll;
		});
	}

	onMount(fetchRequests);
</script>

<div>
	<Dialog.Root>
		<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
			<LucideList /> View audio whitelist requests
		</Dialog.Trigger>
		<Dialog.Content class="w-full max-w-6xl" interactOutsideBehavior="ignore">
			<Dialog.Header>
				<Dialog.Title>Audio Whitelist Requests</Dialog.Title>
			</Dialog.Header>

			{#if loading.fetchingRequests}
				<div class="flex gap-x-2">
					<LucideLoaderCircle class="animate-spin" /> Loading...
				</div>
			{:else if requests.length === 0}
				<div class="flex gap-x-2">No audio whitelist requests</div>
			{:else}
				<ul class="max-h-[64rem] divide-y overflow-y-auto">
					{#each requests as request, index}
						<li
							class={`group flex flex-col px-4 py-2 transition-colors duration-300 hover:backdrop-brightness-200 ${index === 0 ? 'rounded-t-lg' : ''} ${index === requests.length - 1 ? 'rounded-b-lg' : ''}`}
						>
							<!-- File Name and Buttons Row -->
							<div class="flex items-center justify-between">
								<!-- File Name and Checkbox -->
								<div class="flex items-center gap-x-2">
									<Checkbox bind:checked={request.isSelected} />
									<span>{request.fileName}</span>
								</div>

								<!-- Buttons (Play, Accept, Reject) -->
								<div class="flex gap-2">
									<!-- Play/Pause Button -->
									<Button
										variant="outline"
										size="icon"
										onclick={() => togglePlayPause(request.id, request.fileURL)}
									>
										{#if currentlyPlayingId === request.id && isPlaying}
											<LucidePause />
										{:else}
											<LucidePlay />
										{/if}
									</Button>
									{#if !isSelectionMode}
										<!-- Accept Button -->
										<Button
											variant="success"
											disabled={loading[`${request.id}:accept`] || loading[request.id]}
											onclick={() => handleRequest(request.id, 'accept')}
										>
											{#if loading[`${request.id}:accept`]}
												<LucideLoaderCircle class="animate-spin" />
											{:else}
												<LucideCheck />
											{/if}
											Accept
										</Button>
										<!-- Reject Button -->
										<Button
											variant="destructive"
											disabled={loading[`${request.id}:reject`] || loading[request.id]}
											onclick={() => handleRequest(request.id, 'reject')}
										>
											{#if loading[`${request.id}:reject`]}
												<LucideLoaderCircle class="animate-spin" />
											{:else}
												<LucideX />
											{/if}
											Reject
										</Button>
									{/if}
								</div>
							</div>

							<!-- Error Message (aligned with the file name) -->
							{#if errors[request.id]}
								<div class="mt-1 pl-8 text-sm text-red-500">
									{errors[request.id]}
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			<Dialog.Footer>
				<div class="mt-4 flex w-full items-center justify-between gap-2">
					<div class="flex items-center gap-x-2">
						<Button variant="outline" onclick={fetchRequests} disabled={loading.fetchingRequests}>
							<LucideRefreshCw class={loading.fetchingRequests ? 'animate-spin' : ''} />
							Refresh
						</Button>

						{#if requests.length > 0 && !loading.fetchingRequests}
							<Button
								variant="outline"
								onclick={() => {
									selectAll = !selectAll;
									toggleAllCheckboxes();
								}}
							>
								{selectAll ? 'Deselect All' : 'Select All'}
							</Button>
						{/if}
					</div>

					{#if isSelectionMode && !loading.fetchingRequests}
						<div>
							<Button
								variant="success"
								disabled={loading.submit}
								onclick={() => handleBulkAction('accept')}
							>
								{#if loading.submit}
									<LucideLoaderCircle class="animate-spin" />
								{:else}
									<LucideCheck />
								{/if}
								Accept {requests.filter((req) => req.isSelected).length} audio{requests.filter(
									(req) => req.isSelected
								).length === 1
									? ''
									: 's'}
							</Button>
							<Button
								variant="destructive"
								disabled={loading.submit}
								onclick={() => handleBulkAction('reject')}
							>
								{#if loading.submit}
									<LucideLoaderCircle class="animate-spin" />
								{:else}
									<LucideX />
								{/if}
								Reject {requests.filter((req) => req.isSelected).length} audio{requests.filter(
									(req) => req.isSelected
								).length === 1
									? ''
									: 's'}
							</Button>
						</div>
					{/if}
				</div>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
