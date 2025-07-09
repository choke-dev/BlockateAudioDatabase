<script lang="ts">
	import LucideLoaderCircle from '~icons/lucide/loader-circle';
	import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';
	import MaterialSymbolsPauseRounded from '~icons/material-symbols/pause-rounded';

	interface Props {
		audioId: string;
		isPlaying: boolean;
		isLoading: boolean;
		downloadProgress: number;
		onPlay: (audioId: string) => void;
	}

	let {
		audioId,
		isPlaying = false,
		isLoading = false,
		downloadProgress = 0,
		onPlay
	}: Props = $props();

	const circleRadius = 11;
	const circleCircumference = 2 * Math.PI * circleRadius;
</script>

<button
	class={`flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors ${isPlaying ? 'bg-white text-black hover:bg-white/80' : ''} relative`}
	onclick={() => onPlay(audioId)}
	aria-label={isPlaying ? "Pause audio" : "Play audio"}
>
	{#if isLoading}
		<svg class="absolute inset-0 h-full w-full" viewBox="0 0 24 24">
			<circle
				class="text-primary/10"
				cx="12"
				cy="12"
				r={circleRadius}
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle
				class="text-white"
				cx="12"
				cy="12"
				r={circleRadius}
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-dasharray={circleCircumference}
				stroke-dashoffset={circleCircumference * (1 - downloadProgress / 100)}
				stroke-linecap="round"
				transform="rotate(-90 12 12)"
			/>
		</svg>
		<LucideLoaderCircle class="h-4 w-4 animate-spin relative z-10" />
	{:else if isPlaying}
		<MaterialSymbolsPauseRounded class="size-6" />
	{:else}
		<MaterialSymbolsPlayArrowRounded class="size-6" />
	{/if}
</button>