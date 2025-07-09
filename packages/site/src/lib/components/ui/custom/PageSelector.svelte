<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import LucideArrowRight from '~icons/lucide/arrow-right';

	interface Props {
		totalItems: number;
		maxResultsPerPage: number;
		onPageChange: (page: number) => void;
	}

	let {
		totalItems,
		maxResultsPerPage,
		onPageChange
	}: Props = $props();

	function handleSubmit(event: Event) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const pageInput = formData.get('pageInput');
		const pageNumber = pageInput ? parseInt(pageInput.toString()) : null;
		
		if (
			pageNumber &&
			!isNaN(pageNumber) &&
			pageNumber > 0 &&
			pageNumber <= Math.ceil(totalItems / maxResultsPerPage)
		) {
			onPageChange(pageNumber);
			// Clear page input
			(event.currentTarget as HTMLFormElement).reset();
		}
	}
</script>

<div class="mt-4 flex items-center justify-center gap-2">
	<span class="text-sm text-zinc-400">Go to page:</span>
	<form class="flex items-center gap-2" onsubmit={handleSubmit}>
		<Input
			name="pageInput"
			class="w-16 text-center"
			placeholder=""
		/>
		<Button type="submit" size="icon">
			<LucideArrowRight class="size-8" />
		</Button>
	</form>
</div>