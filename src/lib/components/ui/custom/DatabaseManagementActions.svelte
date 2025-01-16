<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/index";
    
    import LucideSquarePlus from '~icons/lucide/square-plus';
    import LucidePencil from '~icons/lucide/pencil';
    import LucideTrash2 from '~icons/lucide/trash-2';
    import LucideX from '~icons/lucide/x';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';
    
    import Input from "$lib/components/ui/input/input.svelte";
    import { writable } from 'svelte/store';
    import { getFlash } from "sveltekit-flash-message";
    import { page } from "$app/state";
    
    const flash = getFlash(page);
    let audioBatchAdd = writable([
    { id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '' }
    ]);
    let audioBatchEdit = writable([
    { id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '', fetchedRecord: false }
    ]);
    let audioBatchDelete = writable([
    { id: '' }
    ]);
    
    let loading = $state({
        add: false,
        edit: false,
        delete: false
    })
    
    const addAudioEntry = () => {
        audioBatchAdd.update(batch => [...batch, { id: '', name: '', category: '', whitelisterName: '', whitelisterUserId: '' }]);
    };
    
    const removeAudioEntry = (index: number) => {
        audioBatchAdd.update(batch => batch.filter((_, i) => i !== index));
    };
    
    const addDeleteEntry = () => {
        audioBatchDelete.update(batch => [...batch, { id: '' }]);
    };
    
    const removeDeleteEntry = (index: number) => {
        audioBatchDelete.update(batch => batch.filter((_, i) => i !== index));
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
    
    const submitBatchDelete = async () => {
        const validateIds = $audioBatchDelete.every(audio => {
            const idValid = typeof parseInt(audio.id, 10) === 'number' && parseInt(audio.id, 10) > 0;
            if (!idValid) {
                $flash = { type: "error", message: `Found an invalid ID in one of the delete entries.` };
                return false;
            }
            return true;
        });
        if (!$audioBatchDelete.length || !$audioBatchDelete.every(audio => Object.values(audio).every(value => !!value)) || !validateIds) return;
        
        loading.delete = true;
        
        const parsedAudioBatchDelete = $audioBatchDelete.map(audio => audio.id);
        
        const response = await fetch('/api/dashboard/audio/batch', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedAudioBatchDelete)
        });
        
        if (!response.ok) {
            const responseErrorData = await response.json();
            $flash = { type: "error", message: `Failed to delete ${parsedAudioBatchDelete.length} audio${parsedAudioBatchDelete.length === 1 ? '' : 's'}: ${responseErrorData.errors[0].message}` };
            loading.delete = false;
            return;
        }
        
        loading.delete = false;
        audioBatchDelete.set([{ id: '' }]);
        $flash = { type: "success", message: `Deleted ${parsedAudioBatchDelete.length} audio${parsedAudioBatchDelete.length === 1 ? '' : 's'} from the database.` };
    };
</script>

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
                    <Input required={true} bind:value={audio.id} placeholder="ID" />
                    <Input required={true} bind:value={audio.name} placeholder="Name" />
                    <Input required={true} bind:value={audio.category} placeholder="Category" />
                    <Input required={true} bind:value={audio.whitelisterName} placeholder="Whitelister Name" />
                    <Input required={true} bind:value={audio.whitelisterUserId} placeholder="Whitelister User ID" />
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
            <Button onclick={submitBatchAdd} disabled={loading.add} type="submit"> {#if loading.add} <LucideLoaderCircle class="animate-spin" /> {:else} <LucideSquarePlus /> {/if} Add audio{Math.abs($audioBatchAdd.length) === 1 ? '' : 's'}</Button>
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
                <Input required={true} bind:value={audio.id} placeholder="ID" name="id" onblur={() => fetchAudioDetails(audio.id, index)} />
                    <Input required={true} bind:value={audio.name} placeholder="Name" disabled={!$audioBatchEdit[index].fetchedRecord} />
                    <Input required={true} bind:value={audio.category} placeholder="Category" disabled={!$audioBatchEdit[index].fetchedRecord} />
                    <Input required={true} bind:value={audio.whitelisterName} placeholder="Whitelister Name" disabled={!$audioBatchEdit[index].fetchedRecord} />
                    <Input required={true} bind:value={audio.whitelisterUserId} placeholder="Whitelister User ID" name="whitelisterUserId" disabled={!$audioBatchEdit[index].fetchedRecord} />
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
            <Button onclick={submitBatchEdit} disabled={loading.edit} type="submit"> {#if loading.edit} <LucideLoaderCircle class="animate-spin" /> {:else} <LucidePencil /> {/if} Update audio{Math.abs($audioBatchEdit.length) === 1 ? '' : 's'}</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root>
    <Dialog.Trigger class={buttonVariants({ variant: "destructive" })}>
        <LucideTrash2 /> Delete audio
    </Dialog.Trigger>
    <Dialog.Content class="w-full max-w-4xl" interactOutsideBehavior="ignore">
        <Dialog.Header>
            <Dialog.Title>Delete Audio{Math.abs($audioBatchDelete.length) === 1 ? '' : 's'}</Dialog.Title>
            <Dialog.Description>Delete audios from the database</Dialog.Description>
        </Dialog.Header>
        <div class="space-y-4">
            {#each $audioBatchDelete as audio, index}
            <div class="flex items-center space-x-2">
                <Input required={true} bind:value={audio.id} placeholder="ID" />
                <Button
                class="text-red-500 hover:bg-transparent hover:text-accent-foreground"
                variant="ghost"
                size="icon"
                onclick={() => removeDeleteEntry(index)}
                >
                <LucideX />
            </Button>
        </div>
        {/each}
        
    </div>
    <Dialog.Footer>
        <Button onclick={addDeleteEntry} variant="outline"> <LucideSquarePlus /> Add more</Button>
        <Button onclick={submitBatchDelete} disabled={loading.delete} variant="destructive" type="submit"> {#if loading.delete} <LucideLoaderCircle class="animate-spin" /> {:else} <LucideTrash2 /> {/if} Delete audio{Math.abs($audioBatchDelete.length) === 1 ? '' : 's'}</Button>
    </Dialog.Footer>
</Dialog.Content>
</Dialog.Root>
</div>