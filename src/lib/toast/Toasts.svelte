<script context='module' lang="ts">
    import { writable } from "svelte/store";
    import { Toaster } from "./toast.ts";
    import { fly, slide, fade } from "svelte/transition";
    import { flip } from "svelte/animate";
    import { quintOut } from "svelte/easing";

    // export let toasts = writable([]);
    export let toaster: Toaster = new Toaster();
    
    let toasts = toaster.active;
</script>

<script lang="ts">
</script>

<div class='fixed top-4 right-4 flex flex-col h-10 gap-2'>
    {#each $toasts as toast (toast.id)}
        <div
            in:fly={{ y: -20, duration: 200 }}
            out:fly={{ x: 20, duration: 200 }}
            animate:flip={{ duration: 200 }}
            class='{toast.toast.classes}'
        >
            {toast.toast.message}
        </div>
    {/each}
</div>
