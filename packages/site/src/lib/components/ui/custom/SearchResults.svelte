<script lang="ts">
	import * as Pagination from '$lib/components/ui/pagination/index';
	import AudioResultsTable from './AudioResultsTable.svelte';
	import PageSelector from './PageSelector.svelte';
	import LucideLoaderCircle from '~icons/lucide/loader-circle';
	import { MAX_SEARCH_RESULTS_PER_PAGE } from '$lib/config/search';
	import type { Audio } from '@prisma/client';

	interface Props {
		started: boolean;
		loading: boolean;
		searchResults: Audio[];
		totalItems: number;
		currentPage: number;
		currentlyPlayingId: string | null;
		loadingAudioId: string | null;
		downloadProgress: Record<string, number>;
		prefetchingAudio: boolean;
		onPlayAudio: (audioId: string) => void;
		onPageChange: (page: number, event?: Event) => void;
	}

	let {
		started,
		loading,
		searchResults,
		totalItems,
		currentPage,
		currentlyPlayingId,
		loadingAudioId,
		downloadProgress,
		prefetchingAudio,
		onPlayAudio,
		onPageChange
	}: Props = $props();
</script>

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
		<AudioResultsTable
			{searchResults}
			{currentlyPlayingId}
			{loadingAudioId}
			{downloadProgress}
			{onPlayAudio}
		/>

		{#if started && !loading && searchResults.length === 0}
			<div class="mt-4 flex items-center justify-center">No results found.</div>
		{/if}

		<!-- Pagination Component -->
		<Pagination.Root class="mt-8" count={totalItems} perPage={MAX_SEARCH_RESULTS_PER_PAGE} bind:page={currentPage}>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton onclick={(event) => onPageChange(currentPage - 1)} />
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
									onclick={(event) => onPageChange(page.value)}
								>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}

					<Pagination.Item>
						<Pagination.NextButton onclick={(event) => onPageChange(currentPage + 1)} />
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
		
		<!-- Page selector -->
		<PageSelector
			{totalItems}
			maxResultsPerPage={MAX_SEARCH_RESULTS_PER_PAGE}
			onPageChange={onPageChange}
		/>
	</div>
</div>