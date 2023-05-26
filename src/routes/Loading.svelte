<script lang="ts">
    // Prop exported that will be filled by the router
    export let params: { message: string };
</script>

<h2>Loading…</h2>

<p>We're loading the route!</p>
<p>Here's your message: {params && params.message}</p>
