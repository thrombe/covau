<script lang="ts">
    import { new_innertube_instance } from '../lib/searcher/tube';
    import Loading from './Loading.svelte';
    import Vibe from './Vibe.svelte';

    export let params: { group?: string };

    let message = {
        message: 'loading yaaaah',
    };
</script>

{#await new_innertube_instance()}
    <Loading params={message} />
{:then tube}
    <Vibe bind:params {tube} />
{/await}
