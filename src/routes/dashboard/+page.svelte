<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/index";
    
    import LucideSquarePlus from '~icons/lucide/square-plus';
    import LucidePencil from '~icons/lucide/pencil';
    import LucideTrash2 from '~icons/lucide/trash-2';
    import LucideX from '~icons/lucide/x';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';
    
    import type { PageData } from "./$types";
    import Input from "$lib/components/ui/input/input.svelte";
    import { writable } from 'svelte/store';
	import { getFlash } from "sveltekit-flash-message";
	import { page } from "$app/state";
	import type { User } from "@prisma/client";

    const flash = getFlash(page);
    let { data }: { data: PageData } = $props();
    let audioBatchAdd = writable([
        { id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '' }
    ]);
    let audioBatchEdit = writable([
        { id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '', fetchedRecord: false }
    ]);

    let loading = $state({
        add: false,
        edit: false
    })

    const addAudioEntry = () => {
        audioBatchAdd.update(batch => [...batch, { id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '' }]);
    };

    const removeAudioEntry = (index: number) => {
        audioBatchAdd.update(batch => batch.filter((_, i) => i !== index));
    };

    const fetchAudioDetails = async (id: string, index: number) => {
        if (!id) return;
        try {
            const response = await fetch(`/api/dashboard/audio/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    $flash = { type: "error", message: `Audio ID ${id} does not exist.` };
                }
                return;
            }
            const audioDetails = await response.json();
            audioBatchEdit.update(batch => {
                batch[index] = audioDetails.data;
                batch[index].fetchedRecord = true;
                return batch;
            });
        } catch (error) {
            console.error(error);
            $flash = { type: "error", message: `Failed to fetch audio details for ID: ${id}` };
        }
    };

    const submitBatchAdd = async () => {
        const validateIds = $audioBatchAdd.every(audio => {
            const idValid = typeof parseInt(audio.id, 10) === 'number' && parseInt(audio.id, 10) > 0;
            const whitelisterUserIdValid = typeof parseInt(audio.whitelisterUserId, 10) === 'number' && parseInt(audio.whitelisterUserId, 10) > 0;
            if (!idValid || !whitelisterUserIdValid) {
                $flash = { type: "error", message: `Found an invalid ID or Whitelister User ID in one of the audio entries.` };
                return false;
            }
            return true;
        });
        if (!$audioBatchAdd.length || !$audioBatchAdd.every(audio => Object.values(audio).every(value => !!value)) || !validateIds) return;

        loading.add = true;

        const parsedAudioBatchAdd = $audioBatchAdd.map(audio => ({
            id: parseInt(audio.id, 10),
            name: audio.name,
            category: audio.category,
            whitelisterName: audio.whitelisterName,
            whitelisterUserId: parseInt(audio.whitelisterUserId, 10)
        }));

        const response = await fetch('/api/dashboard/audio/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedAudioBatchAdd)
        });
        if (!response.ok) {
            const responseErrorData = await response.json();
            $flash = { type: "error", message: `Failed to add ${parsedAudioBatchAdd.length} audio${Math.abs(parsedAudioBatchAdd.length) === 1 ? '' : 's'} to the database: ${responseErrorData.errors[0].message}` };
            loading.add = false;
            return;
        }

        const responseData = await response.json();
        loading.add = false;
        audioBatchAdd.set([{ id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '' }]);
        $flash = { type: "success", message: `Added ${responseData.data.count} audio${responseData.data.count === 1 ? '' : 's'} to the database.` };
    };

    const submitBatchEdit = async () => {

        const validateIds = $audioBatchEdit.every(audio => {
            const idValid = typeof parseInt(audio.id, 10) === 'number' && parseInt(audio.id, 10) > 0;
            const whitelisterUserIdValid = typeof parseInt(audio.whitelisterUserId, 10) === 'number' && parseInt(audio.whitelisterUserId, 10) > 0;
            if (!idValid || !whitelisterUserIdValid) {
                $flash = { type: "error", message: `Found an invalid ID or Whitelister User ID in one of the audio entries.` };
                return false;
            }
            return true;
        });
        if (!$audioBatchEdit.length || !$audioBatchEdit.every(audio => Object.values(audio).every(value => !!value)) || !validateIds) return;

        loading.edit = true;

        const parsedAudioBatchEdit = $audioBatchEdit.map(audio => ({
            id: parseInt(audio.id, 10),
            name: audio.name,
            category: audio.category,
            whitelisterName: audio.whitelisterName,
            whitelisterUserId: parseInt(audio.whitelisterUserId, 10)
        }));

        const response = await fetch('/api/dashboard/audio/batch', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedAudioBatchEdit)
        });
        if (!response.ok) {
            const responseErrorData = await response.json();
            loading.edit = false
            $flash = { type: "error", message: `Failed to update ${parsedAudioBatchEdit.length} audio${parsedAudioBatchEdit.length === 1 ? '' : 's'}: ${responseErrorData.errors[0].message}` };
            return;
        }

        loading.edit = false
        audioBatchEdit.set([{ id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '', fetchedRecord: false }]);
        $flash = { type: "success", message: `Updated ${parsedAudioBatchEdit.length} audio${parsedAudioBatchEdit.length === 1 ? '' : 's'} in the database.` };
    };
</script>

<svelte:head>
<title>Blockate Audio Database - Dashboard</title> 
</svelte:head>

<div class="flex items-center justify-start mt-32 mx-32">
    <div class="flex flex-col  justify-start">
        <div>
            <h1 class="text-left text-7xl font-poppins">Welcome, <span class="font-bold">{data.username}</span></h1>
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
                        <Dialog.Title>Add Audio{Math.abs($audioBatchAdd.length) === 1 ? '' : 's'}</Dialog.Title>
                        <Dialog.Description>Add audios to the database</Dialog.Description>
                    </Dialog.Header>
                    <div class="space-y-4">
                        {#each $audioBatchAdd as audio, index}
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
                        <Button onclick={submitBatchAdd} disabled={loading.add} type="submit"> {#if loading.add} <LucideLoaderCircle class="animate-spin" /> {/if} Add audio</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root>
                <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>
                    <LucidePencil /> Edit audio
                </Dialog.Trigger>
                <Dialog.Content class="w-full max-w-4xl" interactOutsideBehavior="ignore">
                    <Dialog.Header>
                        <Dialog.Title>Edit Audio{Math.abs($audioBatchEdit.length) === 1 ? '' : 's'}</Dialog.Title>
                        <Dialog.Description>Edit audios in the database</Dialog.Description>
                    </Dialog.Header>
                    <div class="space-y-4">
                        {#each $audioBatchEdit as audio, index}
                        <div class="flex items-center space-x-2">
                            <Input bind:value={audio.id} placeholder="ID" name="id" onblur={() => fetchAudioDetails(audio.id, index)} />
                            <Input bind:value={audio.name} placeholder="Name" disabled={!$audioBatchEdit[index].fetchedRecord} />
                            <Input bind:value={audio.category} placeholder="Category" disabled={!$audioBatchEdit[index].fetchedRecord} />
                            <Input bind:value={audio.whitelisterName} placeholder="Whitelister Name" disabled={!$audioBatchEdit[index].fetchedRecord} />
                            <Input bind:value={audio.whitelisterUserId} placeholder="Whitelister User ID" name="whitelisterUserId" disabled={!$audioBatchEdit[index].fetchedRecord} />
                            <Button
                            class="text-red-500 hover:bg-transparent hover:text-accent-foreground"
                            variant="ghost"
                            size="icon"
                            onclick={() => audioBatchEdit.update(batch => batch.filter((_, i) => i !== index))}
                            >
                                <LucideX />
                            </Button>
                        </div>
                        {/each}
                        
                    </div>
                    <Dialog.Footer>
                        <Button onclick={() => audioBatchEdit.update(batch => [...batch, { id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '', fetchedRecord: false }])} variant="outline"> <LucideSquarePlus /> Add more</Button>
                        <Button onclick={submitBatchEdit} disabled={loading.edit} type="submit"> {#if loading.edit} <LucideLoaderCircle class="animate-spin" /> {/if} Update audio</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root>
                <Dialog.Trigger disabled={true} class={buttonVariants({ variant: "destructive" })}>
                    <LucideTrash2 /> Delete audio
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-[425px]" interactOutsideBehavior="ignore">
                    <Dialog.Header>
                        <Dialog.Title>Delete audio</Dialog.Title>
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