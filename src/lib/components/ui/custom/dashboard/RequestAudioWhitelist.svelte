<script lang="ts">

	import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/index";

    import LucideSquarePlus from '~icons/lucide/square-plus';
    import LucideLoaderCircle from '~icons/lucide/loader-circle';
    import LucideSendHorizontal from '~icons/lucide/send-horizontal';

    let loading = $state({
        submit: false,
    })

</script>
<div class="mt-4">

    <Dialog.Root>
        <Dialog.Trigger class={buttonVariants({ variant: "default" })}>
            <LucideSquarePlus /> Create new audio whitelist request
        </Dialog.Trigger>
        <Dialog.Content class="w-full max-w-4xl" interactOutsideBehavior="ignore">
            <Dialog.Header>
                <Dialog.Title>Create new audio whitelist request</Dialog.Title>
                <Dialog.Description></Dialog.Description>
            </Dialog.Header>



            <Dialog.Footer>
                <Button disabled={loading.submit} type="submit"> {#if loading.submit} <LucideLoaderCircle class="animate-spin" /> {:else} <LucideSendHorizontal /> {/if} Submit Request</Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

</div>