<script lang="ts">
    import { new_innertube_instance } from '$lib/searcher/tube.ts';
    import Loading from './Loading.svelte';
    import Vibe from './Vibe.svelte';

    export let params: { group?: string };

    let props = {
        message: 'loading yaaaah',
    };
</script>

{#await new_innertube_instance()}
    <Loading params={props} />
{:then tube}
    <Vibe bind:params {tube} />
{/await}
