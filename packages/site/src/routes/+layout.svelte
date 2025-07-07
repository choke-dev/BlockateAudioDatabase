<script lang="ts">
	import { page, updated } from '$app/state';
	import { onDestroy, onMount } from 'svelte';
	import { getFlash } from 'sveltekit-flash-message';

	import LucideCircleAlert from '~icons/lucide/circle-alert';
	import LucideCircleCheck from '~icons/lucide/circle-check';
	import LucideInfo from '~icons/lucide/info';

	import Header from '$lib/components/ui/custom/Header.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import '../app.css';
	let { children, data } = $props();

	const flash = getFlash(page, {
		clearAfterMs: 10900
	});

	let versionCheckInterval: NodeJS.Timeout;
	// Reload immediately if outdated on first load
  	onMount(async () => {
    	if (await updated.check()) {
    	  location.reload();
    	}

    	// Then check every hour (60*60*1000 ms)
    	versionCheckInterval = setInterval(async () => {
    	  if (await updated.check()) {
    	    location.reload();
    	  }
    	}, 3600000);
	});

	onDestroy(() => clearInterval(versionCheckInterval));
</script>

<header class="flex min-h-screen flex-col">
	<div class="fixed bottom-2 left-3 z-[60] text-xs text-white text-opacity-25">
		<Dialog.Root>
			<Dialog.Trigger> <LucideInfo class="size-6" /> </Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Deployment Information</Dialog.Title>
					<Dialog.Description>
						<p>Deployment Environment: {data.deploymentEnvironment}</p>
						<p>Current Deployment ID: {data.deploymentID}</p>
						<p>
							Current Deployment Commit SHA: 
							<a 
							class="underline underline-offset-2" 
							href={`https://github.com/choke-dev/BlockateAudioDatabase/commit/${data.deploymentCommitSHA}`}
							target="_blank"
							>
								{data.deploymentCommitSHA}
							</a>
						</p>
					</Dialog.Description>
				</Dialog.Header>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	{#if $flash}
		<div
			class={`absolute right-8 top-[5rem] z-[99] animate-fadeInOut rounded-lg ${$flash.type === 'success' ? 'bg-[#02311b]' : 'bg-[#3b0703]'}`}
		>
			<div
				class={`flex p-4 font-poppins ${$flash.type === 'success' ? 'text-[#8feab7]' : 'text-[#fab4af]'}`}
			>
				<div class="mr-3">
					{#if $flash.type == 'success'}
						<LucideCircleCheck class="h-6" />
					{:else}
						<LucideCircleAlert class="h-6" />
					{/if}
				</div>
				<div>
					<h1 class="font-bold">
						{($flash.type as string).charAt(0).toUpperCase() + ($flash.type as string).slice(1)}
					</h1>
					<p>{$flash.message}</p>
				</div>
			</div>
		</div>
	{/if}

	<div
		class="fixed inset-0 -z-50 h-full w-full bg-[radial-gradient(#241C1C_1px,transparent_1px)] [background-size:16px_16px]"
	></div>
	<!-- optimally, i would want this to calculate the color based on the background with a lighter shade, but i dont know how, if you're reading this and know how, please let me know -->
	<div class="fixed inset-x-0 top-0 z-50">
		<Header />
	</div>
	<div class="mb-14 mt-0 flex-grow md:mb-0 md:mt-14">
		{@render children()}
	</div>
</header>

<!-- text color 8feab7 -->
<!-- bg color 02311b -->
