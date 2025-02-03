<script lang="ts">
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	import LucideCircleAlert from '~icons/lucide/circle-alert';
	import LucideCircleCheck from '~icons/lucide/circle-check';

	import Header from '$lib/components/ui/custom/Header.svelte';
	import "../app.css";
	let { children } = $props();

	const flash = getFlash(page, {
		clearAfterMs: 10900
	});
</script>

<header class="flex flex-col min-h-screen z-50">

	{#if $flash}
		<div class={`z-[99] animate-fadeInOut absolute top-[5rem] right-8 rounded-lg ${$flash.type === "success" ? "bg-[#02311b]" : "bg-[#3b0703]"}`}>
			<div class={`flex p-4 font-poppins ${$flash.type === "success" ? "text-[#8feab7]" : "text-[#fab4af]"}`}>
				<div class="mr-3"> {#if $flash.type == "success"} <LucideCircleCheck class="h-6" /> {:else} <LucideCircleAlert class="h-6" /> {/if} </div>
				<div>
					<h1 class="font-bold">{($flash.type as string).charAt(0).toUpperCase() + ($flash.type as string).slice(1)}</h1>
					<p>{$flash.message}</p>
				</div>
			</div>
		</div>
	{/if}

	<div class="fixed inset-0 h-full w-full bg-[radial-gradient(#241C1C_1px,transparent_1px)] [background-size:16px_16px] -z-50"></div>
 <!-- optimally, i would want this to calculate the color based on the background with a lighter shade, but i dont know how, if you're reading this and know how, please let me know -->
	<div class="fixed top-0 inset-x-0 hidden md:block z-50">
		<Header />
	</div>
	<div class="flex-grow mt-0 mb-14 md:mt-14 md:mb-0">
		{@render children()}
	</div>
	<div class="fixed bottom-0 inset-x-0 md:hidden z-50">
		<Header />
	</div>

</header>

<!-- text color 8feab7 -->
<!-- bg color 02311b -->

