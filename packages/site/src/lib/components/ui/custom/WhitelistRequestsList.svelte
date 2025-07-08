<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import LucideList from '~icons/lucide/list';
	import LucideLoader2 from '~icons/lucide/loader-2';

	interface WhitelistRequest {
		id: string;
		audioId: string;
		name: string;
		category: string;
		reason: string | null;
		status: 'PENDING' | 'APPROVED' | 'REJECTED';
		createdAt: string;
		updatedAt: string;
	}

	let dialogOpen = $state(false);
	let requests = $state<WhitelistRequest[]>([]);
	let loading = $state(false);
	let error = $state('');

	async function loadRequests() {
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/whitelist/request');
			
			if (!response.ok) {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load requests';
				return;
			}
			
			requests = await response.json();
		} catch (err) {
			console.error('Error loading whitelist requests:', err);
			error = 'Failed to load requests';
		} finally {
			loading = false;
		}
	}

	// Load requests when dialog opens
	$effect(() => {
		if (dialogOpen) {
			loadRequests();
		}
	});

	function getStatusClass(status: string) {
		switch (status) {
			case 'APPROVED':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'REJECTED':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'PENDING':
			default:
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger>
		<Button variant="ghost" size="sm">
			<LucideList class="h-4 w-4 mr-2" />
			My Requests
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>My Whitelist Requests</Dialog.Title>
			<Dialog.Description>
				View the status of your submitted whitelist requests.
			</Dialog.Description>
		</Dialog.Header>
		
		{#if loading}
			<div class="flex items-center justify-center py-8">
				<LucideLoader2 class="h-6 w-6 animate-spin mr-2" />
				Loading requests...
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
				{error}
			</div>
		{:else if requests.length === 0}
			<div class="text-center py-8 text-muted-foreground">
				No whitelist requests found. Submit your first request to get started!
			</div>
		{:else}
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Audio ID</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head>Category</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Submitted</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each requests as request}
							<Table.Row>
								<Table.Cell class="font-mono">{request.audioId}</Table.Cell>
								<Table.Cell class="max-w-[200px] truncate" title={request.name}>
									{request.name}
								</Table.Cell>
								<Table.Cell>{request.category}</Table.Cell>
								<Table.Cell>
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {getStatusClass(request.status)}">
										{request.status}
									</span>
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{formatDate(request.createdAt)}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
		
		<Dialog.Footer>
			{#if !loading && !error}
				<Button
					variant="outline"
					type="button"
					onclick={loadRequests}
				>
					Refresh
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>