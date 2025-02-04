<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { onMount } from 'svelte';
	import LucideLoaderCircle from '~icons/lucide/loader-circle';
	import LucideRefreshCw from '~icons/lucide/refresh-cw';
	import LucideSend from '~icons/lucide/send';

	let loading = $state<{ [key: string]: boolean }>({
		fetchingRequests: false,
		submit: false   
	});

	let errors = $state<{ [key: string]: string | null }>({}); // Track errors for each request

	type UploadedAudio = {
		id: string;
		name: string;
		category: string;
	};

	let audios = $state<(UploadedAudio & { isSelected: boolean })[]>([]);

	async function fetchAudios() {
		try {
			loading.fetchingRequests = true;
			const res = await fetch('/api/audio/uploaded');
			const data = await res.json();
			if (data.success) {
				audios = data.data.map((audio: UploadedAudio) => ({
					...audio,
					isSelected: false
				}));
			}
			audios.forEach((element) => {
				loading[element.id] = false;
				errors[element.id] = null; // Reset errors when fetching new audios
			});
		} catch (error) {
			console.error('Error fetching audios:', error);
		} finally {
			loading.fetchingRequests = false;
		}
	}

	// onMount(fetchAudios);
</script>

<div>
	<Dialog.Root>
		<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
			<LucideSend /> Send uploaded audios to whitelister
		</Dialog.Trigger>
		<Dialog.Content class="w-full max-w-6xl" interactOutsideBehavior="ignore">
			<Dialog.Header>
				<Dialog.Title>Send uploaded audios to whitelister?</Dialog.Title>
			</Dialog.Header>

			{#if loading.fetchingRequests}
				<div class="flex gap-x-2">
					<LucideLoaderCircle class="animate-spin" /> Loading...
				</div>
			{:else if audios.length === 0}
				<div class="flex gap-x-2">No uploaded audios found</div>
			{:else}
				<ul class="max-h-96 divide-y overflow-y-auto">
					{#each audios as audio, index}
						<li
							class={`group flex flex-col px-4 py-2 transition-colors duration-300 hover:backdrop-brightness-200 ${index === 0 ? 'rounded-t-lg' : ''} ${index === audios.length - 1 ? 'rounded-b-lg' : ''}`}
						>
							<!-- File Name and Buttons Row -->
							<div class="flex items-center justify-between">
								<!-- File Name and Checkbox -->
								<div class="flex items-center gap-x-2">
									<span>{audio.name}</span>
									<span class="text-sm text-gray-500">({audio.category})</span>
								</div>
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}

			<Dialog.Footer>
				<div class="mt-4 flex w-full items-center justify-between gap-2">
					<div class="flex items-center gap-x-2">
						<Button variant="outline" onclick={fetchAudios} disabled={loading.fetchingRequests}>
							<LucideRefreshCw class={loading.fetchingRequests ? 'animate-spin' : ''} />
							Refresh
						</Button>
				    </div>
                </div>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>