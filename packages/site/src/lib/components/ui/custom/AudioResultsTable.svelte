<script lang="ts">
	import * as Table from '$lib/components/ui/table/index';
	import AudioPlayButton from './AudioPlayButton.svelte';
	import { buildWhitelisterUrl } from '$lib/whitelister';
	import type { Audios } from '@prisma/client';

	interface Props {
		searchResults: Audios[];
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
						{#if audio.is_previewable}
							<AudioPlayButton
							audioId={String(audio.id)}
							isPlaying={currentlyPlayingId === String(audio.id)}
							isLoading={loadingAudioId === String(audio.id)}
							downloadProgress={downloadProgress[String(audio.id)] || 0}
							onPlay={onPlayAudio}
							/>
						{/if}
						{audio.id}
					</div>
				</Table.Head>
				<Table.Head>{audio.name}</Table.Head>
				<Table.Head>{audio.category}</Table.Head>
				<Table.Head class="text-right">
					{#if audio.whitelister && typeof audio.whitelister === 'object'}
						{@const whitelister = audio.whitelister as any}
						{#if whitelister.roblox?.id && whitelister.roblox?.username}
							<a
								class="underline underline-offset-2 transition-colors duration-200 hover:text-white"
								href={buildWhitelisterUrl('roblox', whitelister.roblox.id)}
							>
								{whitelister.roblox.username}
							</a>
						{:else if whitelister.discord?.id && whitelister.discord?.username}
							<a
								class="underline underline-offset-2 transition-colors duration-200 hover:text-white"
								href={buildWhitelisterUrl('discord', whitelister.discord.id)}
							>
								{whitelister.discord.username}
							</a>
						{:else}
							Unknown
						{/if}
					{:else}
						Unknown
					{/if}
				</Table.Head>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>