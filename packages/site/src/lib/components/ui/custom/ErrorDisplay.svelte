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

			<Alert.Root variant="destructive">
				<LucideCircleAlert />
				<Alert.Title class="font-bold">Error</Alert.Title>
				<Alert.Description>{error.message}</Alert.Description>
			</Alert.Root>
		{/each}
	</div>
{/if}