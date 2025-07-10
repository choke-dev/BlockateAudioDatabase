<script lang="ts">
	import * as Alert from "../alert"
	import LucideCircleAlert from '~icons/lucide/circle-alert';

	interface Props {
		errors: { message: string }[];
	}

	let { errors = [] }: Props = $props();
</script>

{#if errors.length > 0}
	<div class={`mb-8 flex items-center justify-center ${errors.length > 0 ? 'mt-4' : ''}`}>
		{#each errors as error}
			<Alert.Root variant="destructive" class="w-[75%]">
				<LucideCircleAlert />
				<Alert.Title class="font-bold">Error</Alert.Title>
				<Alert.Description>{error.message}</Alert.Description>
			</Alert.Root>
		{/each}
	</div>
{/if}