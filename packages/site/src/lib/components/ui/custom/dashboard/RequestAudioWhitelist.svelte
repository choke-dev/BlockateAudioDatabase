<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import FileUpload from "$lib/components/ui/custom/FileUpload.svelte";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import LucideSendHorizontal from '~icons/lucide/send-horizontal';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';
    import LucideTriangleAlert from '~icons/lucide/triangle-alert';

    let files: File[] = $state<File[]>([]);

    let loading = $state({
        submit: false
    });

    let fileUpload: FileUpload;

    const handleSubmit = async () => {

        loading.submit = true;
        await fileUpload.uploadFiles();
        loading.submit = false;
        
    };
</script>

<div class="space-y-4">
    <Dialog.Root>
        <Dialog.Trigger class={buttonVariants({ variant: "default" })}>
            <LucideSendHorizontal /> Submit audio whitelist request
        </Dialog.Trigger>
        <Dialog.Content class="w-full max-w-4xl" interactOutsideBehavior="ignore">
            <Dialog.Header>
                <Dialog.Title>Submit Audio Whitelist Request</Dialog.Title>
                <Dialog.Description>Drag and drop files, or click to select them</Dialog.Description>
                <Dialog.Description class="flex items-center gap-x-2"><LucideTriangleAlert class="text-yellow-500" /> <p>File names must conform to this pattern: <code class="bg-zinc-800">AUDIO CATEGORY --- AUDIO NAME</code></p></Dialog.Description>
            </Dialog.Header>
            
            <FileUpload hideUploadButton={true} bind:files={files} bind:this={fileUpload} />
    
            <Dialog.Footer>
                <Button type="button" onclick={handleSubmit} disabled={files.length === 0 || loading.submit}>
                    {#if loading.submit} 
                        <LucideLoaderCircle class="animate-spin" /> 
                    {:else} 
                        <LucideSendHorizontal /> 
                    {/if}
                    Submit Request
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
</div>
