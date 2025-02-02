<script lang="ts">
	import { uploadConfig } from '$lib/config/upload';
	import Button from '$lib/components/ui/button/button.svelte';
	import LucideTrash2 from '~icons/lucide/trash-2';

	let {
		onUploadComplete = () => {},
		onUploadError = () => {},
		files = $bindable<File[]>(),
		hideUploadButton = false
	}: {
		onUploadComplete?: () => void;
		onUploadError?: (error: Error) => void;
		files?: File[];
		hideUploadButton?: boolean;
	} = $props();

	if (!files) {
		files = [];
	}

	let fileInput: HTMLInputElement;
	let isDragging = $state(false);
	let uploading = $state(false);
	let uploadProgress = $state<{ name: string; progress: number; error?: string }[]>([]);

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		if (e.dataTransfer?.files) {
			const newFiles = Array.from(e.dataTransfer.files).filter(
				(file) =>
					uploadConfig.allowedFileTypes.includes(file.type) && file.size <= uploadConfig.maxFileSize
			);
			files = [...files, ...newFiles];
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			const newFiles = Array.from(target.files).filter((file) =>
				uploadConfig.allowedFileTypes.includes(file.type)
			);
			files = [...files, ...newFiles];
		}
	}

	function removeFile(file: File) {
		files = files.filter((f) => f !== file);
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	async function uploadChunk(
		file: File,
		chunk: Blob,
		chunkIndex: number,
		totalChunks: number,
		uploadId: string
	): Promise<Response> {
		const formData = new FormData();
		formData.append('chunk', chunk);
		formData.append('fileName', file.name);
		formData.append('chunkIndex', chunkIndex.toString());
		formData.append('totalChunks', totalChunks.toString());
		formData.append('uploadId', uploadId);

		return fetch('/api/audio/upload', {
			method: 'POST',
			body: formData
		});
	}

	async function uploadFile(file: File, index: number): Promise<void> {
		const totalChunks = Math.ceil(file.size / uploadConfig.chunkSize);
		const uploadId = crypto.randomUUID();
		let uploadedChunks = 0;

		for (let i = 0; i < totalChunks; i++) {
			const start = i * uploadConfig.chunkSize;
			const end = Math.min(start + uploadConfig.chunkSize, file.size);
			const chunk = file.slice(start, end);

			try {
				const response = await uploadChunk(file, chunk, i, totalChunks, uploadId);
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Upload failed');
				}

				uploadedChunks++;
				const progress = Math.round((uploadedChunks * 100) / totalChunks);
				uploadProgress[index].progress = progress;
				uploadProgress = [...uploadProgress];
			} catch (error) {
				console.error(`Error uploading chunk ${i} of file ${file.name}:`, error);
				uploadProgress[index] = {
					...uploadProgress[index],
					error: (error as Error)?.message ?? 'Upload failed'
				};
				uploadProgress = [...uploadProgress];
				throw error;
			}
		}
	}

	export async function uploadFiles() {
		if (files.length === 0) return;

		uploading = true;
		uploadProgress = files.map((file) => ({ name: file.name, progress: 0 }));

		try {
			await Promise.all(
				files.map((file, index) => uploadFile(file, index).catch(() => {})) // Catch errors to allow other files to continue uploading
			);

			// Check if any files failed to upload
			const failedUploads = uploadProgress.filter((up) => up.error);
			if (failedUploads.length > 0) {
				throw new Error('Some files failed to upload');
			}

			// Reset after successful upload
			files = [];
			uploading = false;
			uploadProgress = [];
			onUploadComplete();
		} catch (error) {
			console.error('Upload failed:', error);
			uploading = false;

			// Remove only successfully uploaded files from the list
			files = files.filter((file, index) => uploadProgress[index]?.error);
			uploadProgress = uploadProgress.filter((up) => up.error);

			if (error instanceof Error) {
				onUploadError(error);
			} else {
				onUploadError(new Error('Upload failed'));
			}
		}
	}
</script>

<div
	class={`rounded-lg border-2 p-8 ${isDragging ? 'border-dashed border-blue-500' : ''}`}
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondragover={handleDragOver}
	ondrop={handleDrop}
	role="region"
>
	<input
		type="file"
		multiple
		bind:this={fileInput}
		accept={[...uploadConfig.allowedFileTypes].join(',')}
		onchange={handleFileSelect}
		class="hidden"
	/>

	<div
		class={`text-center ${isDragging ? 'pointer-events-none' : ''}`}
		ondragleave={handleDragLeave}
		ondragover={handleDragOver}
		role="region"
	>
		<svg
			class="mx-auto h-12 w-12"
			stroke="currentColor"
			fill="none"
			viewBox="0 0 48 48"
			aria-hidden="true"
		>
			<path
				d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<div class="mt-4">
			<Button onclick={() => fileInput.click()}>Select files</Button>
		</div>
		<p class="mt-2 text-sm">or drag and drop files here</p>
		{#if uploadConfig.allowedFileTypes.length > 0}
			<p class="mt-2 text-sm text-zinc-400">
				Allowed file types: {Array.from(
					new Set(uploadConfig.allowedFileTypes.map((type) => type.replace(/^.*\//, '')))
				).join(', ')}
			</p>
		{/if}
		{#if uploadConfig.maxFileSize > 0}
			<p class="mt-2 text-sm text-zinc-400">
				Max file size: {formatFileSize(uploadConfig.maxFileSize)}
			</p>
		{/if}
	</div>
</div>

{#if files.length > 0}
	<div class="max-h-64 overflow-y-auto">
		<ul class="divide-y">
			{#each files as file, index}
				<li class="flex items-center justify-between py-3">
					<div class="flex flex-col">
						<div class="flex items-center">
							<span class="text-sm font-medium">{file.name}</span>
							<span class="ml-2 text-sm">({formatFileSize(file.size)})</span>
						</div>
						{#if uploadProgress[index]?.error}
							<div class="mt-1 text-sm text-red-500">
								{uploadProgress[index].error}
							</div>
						{/if}
						{#if uploading}
							<div class="mt-2 h-2 w-64 rounded-full bg-gray-200">
								<div
									class="h-full rounded-full bg-blue-500 transition-all duration-300"
									style="width: {uploadProgress[index]?.progress || 0}%"
								></div>
							</div>
						{/if}
					</div>
					<Button variant="destructive" size="icon" onclick={() => removeFile(file)}>
						<LucideTrash2 />
					</Button>
				</li>
			{/each}
		</ul>
	</div>
	{#if !hideUploadButton}
		<div class="mt-4">
			<Button onclick={uploadFiles}>
				Upload {files.length}
				{files.length === 1 ? 'file' : 'files'}
			</Button>
		</div>
	{/if}
{/if}
