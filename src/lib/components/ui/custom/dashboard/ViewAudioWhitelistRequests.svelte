<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/index";
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
        submit: false,
    });

    type AudioRequest = {
        fileName: string,
        id: string,
        userId: string,
        fileURL: string,
        createdAt: Date
    }

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
            });
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            loading.fetchingRequests = false;
        }
    }

    $effect(() => {
        const selectedCount = requests.filter(req => req.isSelected).length;
        isSelectionMode = selectedCount > 0;
        selectAll = selectedCount === requests.length && requests.length > 0;
    });

    async function handleRequest(requestId: string, action: 'accept' | 'reject') {
        loading.submit = true;
        loading[requestId] = true;
        loading[`${requestId}:${action}`] = true;
        try {
            console.log(`Sending ${action} request for request ID ${requestId}`);
            fetch(`/api/audio/requests/${requestId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            }).then((res) => {
                requests = requests.filter((request) => request.id !== requestId);
            })
        } catch (error) {
            console.error(`Error ${action}ing request:`, error);
        } finally {
            loading.submit = false;
            loading[requestId] = false;
            loading[`${requestId}:${action}`] = false;
        }
    }

    async function handleBulkAction(action: 'accept' | 'reject') {
        const selectedIds = requests.filter(req => req.isSelected).map(req => req.id);
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
        <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>
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
            {:else}
                {#if requests.length === 0}
                    <div class="flex gap-x-2">
                        No audio whitelist requests
                    </div>
                {:else}
                    <ul class="max-h-[64rem] overflow-y-auto divide-y">
                        {#each requests as request, index}
                            <li
                                class={`flex justify-between py-2 px-4 group hover:backdrop-brightness-200 transition-colors duration-300 ${index === 0 ? 'rounded-t-lg' : ''} ${index === requests.length - 1 ? 'rounded-b-lg' : ''}`}
                                >
                                <div class="flex items-center gap-x-2 flex-1">
                                    <Checkbox 
                                        bind:checked={request.isSelected}
                                    />
                                    <span>{request.fileName}</span>
                                </div>
                                {#if !isSelectionMode}
                                    <div class="flex gap-2">
                                        <!-- Play/Pause Button -->
                                        <Button variant="outline" size="icon" onclick={() => togglePlayPause(request.id, request.fileURL)}>
                                            {#if currentlyPlayingId === request.id && isPlaying}
                                                <LucidePause />
                                            {:else}
                                                <LucidePlay />
                                            {/if}
                                        </Button>
                                        <!-- Accept Button -->
                                        <Button variant="success" disabled={loading[`${request.id}:accept`] || loading[request.id]} onclick={() => handleRequest(request.id, 'accept')}>
                                            {#if loading[`${request.id}:accept`]} <LucideLoaderCircle class="animate-spin" /> {:else} <LucideCheck /> {/if}
                                            Accept
                                        </Button>
                                        <!-- Reject Button -->
                                        <Button variant="destructive" disabled={loading[`${request.id}:reject`] || loading[request.id]} onclick={() => handleRequest(request.id, 'reject')}>
                                            {#if loading[`${request.id}:reject`]} <LucideLoaderCircle class="animate-spin" /> {:else} <LucideX /> {/if}
                                            Reject
                                        </Button>
                                    </div>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                {/if}
            {/if}

            {#if isSelectionMode && !loading.fetchingRequests}
                <Dialog.Footer>
                    <div class="flex justify-between items-center gap-2 mt-4 w-full">
                        <div class="flex items-center gap-x-2">
                            <Button variant="outline" onclick={fetchRequests} disabled={loading.fetchingRequests}>
                                {#if loading.fetchingRequests} <LucideLoaderCircle class="animate-spin" /> {:else} <LucideRefreshCw /> {/if}
                                Refresh
                            </Button>
    
                            <Button variant="outline" onclick={() => { selectAll = !selectAll; toggleAllCheckboxes(); }}>
                                {selectAll ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>

                        <div>
                            <Button variant="success" disabled={loading.submit} onclick={() => handleBulkAction('accept')}>
                                {#if loading.submit} <LucideLoaderCircle class="animate-spin" /> {:else} <LucideCheck /> {/if}
                                Accept {requests.filter(req => req.isSelected).length} audio{requests.filter(req => req.isSelected).length === 1 ? '' : 's'}
                            </Button>
                            <Button variant="destructive" disabled={loading.submit} onclick={() => handleBulkAction('reject')}>
                                {#if loading.submit} <LucideLoaderCircle class="animate-spin" /> {:else} <LucideX /> {/if}
                                Reject {requests.filter(req => req.isSelected).length} audio{requests.filter(req => req.isSelected).length === 1 ? '' : 's'}
                            </Button>
                        </div>
                    </div>
                </Dialog.Footer>
            {:else}
                <Dialog.Footer>
                    <div class="flex justify-start items-center gap-2 mt-4 w-full">
                        <Button variant="outline" onclick={fetchRequests} disabled={loading.fetchingRequests}>
                            {#if loading.fetchingRequests} <LucideLoaderCircle class="animate-spin" /> {:else} <LucideRefreshCw /> {/if}
                            Refresh
                        </Button>
                    </div>
                </Dialog.Footer>
            {/if}
        </Dialog.Content>
    </Dialog.Root>
</div>