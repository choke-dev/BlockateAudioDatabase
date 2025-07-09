<script lang="ts">
	import * as Table from '$lib/components/ui/table/index';
	import AudioPlayButton from './AudioPlayButton.svelte';
	import { buildWhitelisterUrl } from '$lib/whitelister';
	import type { Audio } from '@prisma/client';

	interface Props {
		searchResults: Audio[];
		currentlyPlayingId: string | null;
		loadingAudioId: string | null;
		downloadProgress: Record<string, number>;
		onPlayAudio: (audioId: string) => void;
	}

	let {
		searchResults = [],
		currentlyPlayingId = null,
		loadingAudioId = null,
		downloadProgress = {},
		onPlayAudio
	}: Props = $props();
</script>

<Table.Root class="rounded-lg border backdrop-blur-sm">
	<Table.Header class="rounded-lg">
		<Table.Row>
			<Table.Head class="w-[200px]">Audio ID</Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head>Category</Table.Head>
			<Table.Head class="text-right">Whitelister</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each searchResults as audio}
			<Table.Row>
				<Table.Head class="w-[200px]">
					<div class="flex items-center gap-2">
						{#if audio.version === 2}
							<AudioPlayButton
								audioId={audio.id}
								isPlaying={currentlyPlayingId === audio.id}
								isLoading={loadingAudioId === audio.id}
								downloadProgress={downloadProgress[audio.id] || 0}
								onPlay={onPlayAudio}
							/>
						{/if}
						{audio.id}
					</div>
				</Table.Head>
				<Table.Head>{audio.name}</Table.Head>
				<Table.Head>{audio.category}</Table.Head>
				<Table.Head class="text-right">
					<a
						class="underline underline-offset-2 transition-colors duration-200 hover:text-white"
						href={buildWhitelisterUrl(audio.whitelisterType, audio.whitelisterUserId)}
					>
						{audio.whitelisterName}
					</a>
				</Table.Head>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>