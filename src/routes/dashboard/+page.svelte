<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/index";
    
    import LucideSquarePlus from '~icons/lucide/square-plus';
    import LucidePencil from '~icons/lucide/pencil';
    import LucideTrash2 from '~icons/lucide/trash-2';
    import LucideX from '~icons/lucide/x';
    
    import type { PageData } from "./$types";
    import Input from "$lib/components/ui/input/input.svelte";
    import { writable } from 'svelte/store';
	import { getFlash } from "sveltekit-flash-message";
	import { page } from "$app/state";
	import type { User } from "@prisma/client";

    const flash = getFlash(page);
    let { data }: { data: User } = $props();
    let audioBatch = writable([
        { id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '' }
    ]);

    const addAudioEntry = () => {
        audioBatch.update(batch => [...batch, { id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '' }]);
    };

    const removeAudioEntry = (index: number) => {
        audioBatch.update(batch => batch.filter((_, i) => i !== index));
    };

    const submitBatch = async () => {
        const response = await fetch('/api/dashboard/audio/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify($audioBatch)
        });
        if (!response.ok) {
            const responseErrorData = await response.json();
            $flash = { type: "error", message: `Failed to add ${$audioBatch.length} audio${Math.abs($audioBatch.length) === 1 ? '' : 's'} to the database: ${responseErrorData.errors[0].message}` };
            return;
        }

        const responseData = await response.json();
        audioBatch.set([{ id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '' }]);
        $flash = { type: "success", message: `Added ${responseData.data.count} audio${responseData.data.count === 1 ? '' : 's'} to the database.` };
    };
</script>

<svelte:head>
<title>Blockate Audio Database - Dashboard</title> 
</svelte:head>

<div class="flex items-center justify-start mt-32 mx-32">
    <div class="flex flex-col  justify-start">
        <div>
            <h1 class="text-left text-7xl font-poppins">Welcome, <span class="font-bold">{data.global_name}</span></h1>
            <p class="mt-2 text-neutral-700 font-poppins">What would you like to do today?</p>
        </div>
        
        <!-- Buttons -->
        <div class="mt-4 max-w-full">
            <Dialog.Root>
                <Dialog.Trigger class={buttonVariants({ variant: "default" })}>
                    <LucideSquarePlus /> Add audio
                </Dialog.Trigger>
                <Dialog.Content class="w-full max-w-4xl" interactOutsideBehavior="ignore">
                    <Dialog.Header>
                        <Dialog.Title>Add Audio{Math.abs($audioBatch.length) === 1 ? '' : 's'}</Dialog.Title>
                        <Dialog.Description>Add audios to the database</Dialog.Description>
                    </Dialog.Header>
                    <div class="space-y-4">
                        {#each $audioBatch as audio, index}
                        <div class="flex items-center space-x-2">
                            <Input bind:value={audio.id} placeholder="ID" />
                            <Input bind:value={audio.name} placeholder="Name" />
                            <Input bind:value={audio.category} placeholder="Category" />
                            <Input bind:value={audio.whitelisterName} placeholder="Whitelister Name" />
                            <Input bind:value={audio.whitelisterUserId} placeholder="Whitelister User ID" />
                            <Button
                            class="text-red-500 hover:bg-transparent hover:text-accent-foreground"
                            variant="ghost"
                            size="icon"
                            onclick={() => removeAudioEntry(index)}
                            >
                                <LucideX />
                            </Button>
                        </div>
                        {/each}
                        
                    </div>
                    <Dialog.Footer>
                        <Button onclick={addAudioEntry} variant="outline"> <LucideSquarePlus /> Add more</Button>
                        <Button onclick={submitBatch} type="submit"> Add audio</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root>
                <Dialog.Trigger disabled={true} class={buttonVariants({ variant: "outline" })}>
                    <LucidePencil /> Edit audio
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-[425px]" interactOutsideBehavior="ignore">
                    <Dialog.Header>
                        <Dialog.Title>Edit audio</Dialog.Title>
                        <Dialog.Description>Edits an audio's information</Dialog.Description>
                    </Dialog.Header>
                    <!-- content -->
                    <Dialog.Footer>
                        <Button type="submit">Save changes</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root>
                <Dialog.Trigger disabled={true} class={buttonVariants({ variant: "destructive" })}>
                    <LucideTrash2 /> Delete audio(s)
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-[425px]" interactOutsideBehavior="ignore">
                    <Dialog.Header>
                        <Dialog.Title>Delete audio(s)</Dialog.Title>
                        <Dialog.Description>Removes audio from the database</Dialog.Description>
                    </Dialog.Header>
                    <!-- content -->
                    <Dialog.Footer>
                        <Button type="submit">Delete audio</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </div>
    </div>
</div>
