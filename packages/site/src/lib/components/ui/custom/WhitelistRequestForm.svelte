<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import LucideLoader2 from '~icons/lucide/loader-2';
	import LucidePlus from '~icons/lucide/plus';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import Checkbox from '../checkbox/checkbox.svelte';

	let dialogOpen = $state(false);
	let submitting = $state(false);
	let submitMessage = $state('');
	let submitError = $state('');

	// Form data
	let audioId = $state('');
	let name = $state('');
	let category = $state('');
	let privateChecked = $state(false);

	// Form validation errors
	let errors = $state({
		audioId: '',
		name: '',
		category: ''
	});

	function validateForm() {
		errors = {
			audioId: '',
			name: '',
			category: ''
		};

		let isValid = true;

		if (!audioId.trim()) {
			errors.audioId = 'Audio ID is required';
			isValid = false;
		} else if (!/^\d+$/.test(audioId.trim())) {
			errors.audioId = 'Audio ID must be a number';
			isValid = false;
		}

		if (!name.trim()) {
			errors.name = 'Name is required';
			isValid = false;
		}

		if (!category.trim()) {
			errors.category = 'Category is required';
			isValid = false;
		}

		return isValid;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			return;
		}

		submitting = true;
		submitError = '';
		submitMessage = '';

		try {
			const response = await fetch('/api/whitelist/request', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					audioId: audioId.trim(),
					name: name.trim(),
					category: category.trim(),
					is_private: privateChecked
				})
			});

			if (!response.ok) {
				const error = await response.json();
				submitError = error.error || 'Failed to submit whitelist request';
				return;
			}

			const result = await response.json();
			submitMessage = 'Whitelist request submitted successfully!';

			// Close dialog after a short delay to show success message
			setTimeout(() => {
				dialogOpen = false;
				submitMessage = '';
				// Reset form
				audioId = '';
				name = '';
				category = '';
				privateChecked = false;
				errors = { audioId: '', name: '', category: '' };
			}, 2000);
		} catch (error) {
			console.error('Error submitting whitelist request:', error);
			submitError = 'Failed to submit whitelist request';
		} finally {
			submitting = false;
		}
	}

	// Clear messages when dialog opens
	$effect(() => {
		if (dialogOpen) {
			submitMessage = '';
			submitError = '';
		}
	});
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger>
		<Button variant="outline" size="sm">
			<LucidePlus class="mr-2 h-4 w-4" />
			Request Whitelist
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Request Audio Whitelist</Dialog.Title>
			<Dialog.Description>
				Submit a request to whitelist an audio ID. Please provide all required information.
			</Dialog.Description>
		</Dialog.Header>

		{#if submitMessage}
			<div
				class="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-300"
			>
				{submitMessage}
			</div>
		{/if}

		{#if submitError}
			<Alert.Root variant="destructive">
				<Alert.Description>{submitError}</Alert.Description>
			</Alert.Root>
		{/if}

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="audioId">Audio ID</Label>
				<Input
					id="audioId"
					bind:value={audioId}
					placeholder="Enter audio ID (numerical)"
					type="text"
					pattern="[0-9]*"
					inputmode="numeric"
					class={errors.audioId ? 'border-red-500' : ''}
				/>
				<p class="text-sm text-muted-foreground">
					The numerical ID of the audio you want to whitelist
				</p>
				{#if errors.audioId}
					<p class="text-sm text-red-600">{errors.audioId}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="name">Audio Name</Label>
				<Input
					id="name"
					bind:value={name}
					placeholder="Enter audio name"
					class={errors.name ? 'border-red-500' : ''}
				/>
				<p class="text-sm text-muted-foreground">The name or title of the audio</p>
				{#if errors.name}
					<p class="text-sm text-red-600">{errors.name}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="category">Category</Label>
				<Input
					id="category"
					bind:value={category}
					placeholder="Enter category (e.g., Dialogue, Undertale OST, Sound Effects (SFX))"
					class={errors.category ? 'border-red-500' : ''}
				/>
				<p class="text-sm text-muted-foreground">The category this audio belongs to</p>
				{#if errors.category}
					<p class="text-sm text-red-600">{errors.category}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Checkbox id="private" bind:checked={privateChecked} />
				<span class="text-sm text-muted-foreground">
					Checking this will make the audio not appear in search results
				</span>
			</div>
		</div>

		<Dialog.Footer>
			<Button
				type="button"
				variant="outline"
				onclick={() => (dialogOpen = false)}
				disabled={submitting}
			>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={submitting}>
				{#if submitting}
					<LucideLoader2 class="mr-2 h-4 w-4 animate-spin" />
					Submitting...
				{:else}
					Submit Request
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
