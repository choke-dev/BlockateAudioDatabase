<script lang="ts">
    let { class: className = "", ...restProps } = $props();

    import IcBaselineDiscord from '~icons/ic/baseline-discord';
    import MdiGithub from '~icons/mdi/github';
</script>

<!-- Mobile Screen -->
<div class={`flex md:hidden flex-col items-center gap-y-2 w-full ${className}`}>
    <a class="border w-full flex justify-center items-center rounded-lg p-2" target="_blank" href="https://github.com/choke-dev/BlockateAudioDatabase"> 
        <MdiGithub class="text-md mr-2" /> 
        Github Repository
    </a>
    <a class="border w-full flex justify-center items-center rounded-lg p-2" target="_blank" href="https://discord.gg/sxvVTqxZem"> 
        <IcBaselineDiscord class="text-md mr-2" /> 
        Discord Server
    </a>
</div>

<!-- Desktop Screen -->
<div class={`hidden md:flex items-center gap-x-4 ${className}`}>
    <a target="_blank" href="https://github.com/choke-dev/BlockateAudioDatabase"> 
        <MdiGithub class="text-xl text-zinc-400 hover:text-white transition-colors duration-500" /> 
    </a>
    <a target="_blank" href="https://discord.gg/sxvVTqxZem"> 
        <IcBaselineDiscord class="text-xl text-zinc-400 hover:text-white transition-colors duration-500" />
    </a>
</div>