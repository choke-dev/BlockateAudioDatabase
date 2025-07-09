<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import LucideLoaderCircle from '~icons/lucide/loader-circle';
	import LucideSearch from '~icons/lucide/search';
	import LucideX from '~icons/lucide/x';
	import SearchFilter from './SearchFilter.svelte';
	import SearchSort from './SearchSort.svelte';

	interface Props {
		keyword: string;
		lastSearchKeyword: string;
		loading: boolean;
		onSubmit: (event?: Event) => void;
		onFilterChange: (filter: { filters: { label: string; value: string; inputValue: string }[], type: 'and' | 'or' }) => void;
		onSortChange: (sortOption: { field: string, order: 'asc' | 'desc' } | null) => void;
		hasErrors: boolean;
	}

	let {
		keyword = $bindable(),
		lastSearchKeyword = '',
		loading = false,
		onSubmit,
		onFilterChange,
		onSortChange,
		hasErrors = false
	}: Props = $props();

	function clearSearch() {
		keyword = '';
		onSubmit();
	}
</script>

<div class="mx-auto flex w-full max-w-[75%] items-center">
	<div class={`relative mx-auto mb-8 flex w-full items-center justify-between gap-x-2 ${hasErrors ? '' : 'mt-32'}`}>
		<form onsubmit={onSubmit} class="flex w-full max-w-lg items-center gap-x-2">
			<div class="flex flex-grow items-center gap-x-2">
				<div class="flex relative flex-grow">
					<Input bind:value={keyword} name="keyword" placeholder="Search..." class="w-full" />
					{#if lastSearchKeyword.length > 0}
						<Button 
							variant="ghost" 
							size="icon"
							class="absolute right-0 top-0 h-full rounded-none rounded-br-lg rounded-tr-lg"
							onclick={clearSearch}
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
			<SearchFilter updateFilters={onFilterChange} />
			<SearchSort updateSort={onSortChange} />
		</div>
	</div>
</div>