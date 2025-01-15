<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/index";
    
    import LucideSquarePlus from '~icons/lucide/square-plus';
    import LucidePencil from '~icons/lucide/pencil';
    import LucideTrash2 from '~icons/lucide/trash-2';
    
    import type { PageData } from "./$types";
    import Input from "$lib/components/ui/input/input.svelte";
    
    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
<title>Blockate Audio Database - Dashboard</title> 
</svelte:head>

<div class="flex items-center justify-start mt-32 mx-32">
    <div class="flex flex-col  justify-start">
        <div>
            <h1 class="text-left text-7xl font-poppins">Welcome, <span class="font-bold">{data.name}</span></h1>
            <p class="mt-2 text-neutral-700 font-poppins">What would you like to do today?</p>
        </div>
        
        <!-- Buttons -->
        <div class="mt-4">
            <Dialog.Root>
                <Dialog.Trigger class={buttonVariants({ variant: "default" })}>
                    <LucideSquarePlus /> Add audio(s)
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-[425px]" interactOutsideBehavior="ignore">
                    <Dialog.Header>
                        <Dialog.Title>Add Audio(s)</Dialog.Title>
                        <Dialog.Description>Add audios to the database</Dialog.Description>
                    </Dialog.Header>
                    <div class="grid gap-4 py-4">
                        <div class="grid grid-cols-4 items-center gap-4">
                            
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            
                        </div>
                    </div>
                    <Dialog.Footer>
                        <Button type="submit">Save changes</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root>
                <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>
                    <LucidePencil /> Edit audio
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-[425px]" interactOutsideBehavior="ignore">
                    <Dialog.Header>
                        <Dialog.Title>Edit audio</Dialog.Title>
                        <Dialog.Description>Edits an audio's information</Dialog.Description>
                    </Dialog.Header>
                    <div class="grid gap-4 py-4">
                        <div class="grid grid-cols-4 items-center gap-4">
                            
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            
                        </div>
                    </div>
                    <Dialog.Footer>
                        <Button type="submit">Save changes</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root>
                <Dialog.Trigger class={buttonVariants({ variant: "destructive" })}>
                    <LucideTrash2 /> Delete audio(s)
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-[425px]" interactOutsideBehavior="ignore">
                    <Dialog.Header>
                        <Dialog.Title>Delete audio(s)</Dialog.Title>
                        <Dialog.Description>Removes audio from the database</Dialog.Description>
                    </Dialog.Header>
                    <div class="grid gap-4 py-4">
                        <div class="grid grid-cols-4 items-center gap-4">
                            
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            
                        </div>
                    </div>
                    <Dialog.Footer>
                        <Button type="submit">Save changes</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </div>
    </div>
</div>
