<script lang='ts'>
    import Router from 'svelte-spa-router';
    // Import the list of routes
    import routes from './routes';

    import { set_seed } from '$lib/components/BlobBg.svelte';

    let seed = Date.now().toString();
    set_seed(seed);
</script>

<Router {routes} />
