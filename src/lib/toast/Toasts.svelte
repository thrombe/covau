<script context='module' lang="ts">
    import { writable } from "svelte/store";
    import { Toaster } from "./toast.ts";
    import { fly, slide, fade } from "svelte/transition";
    import { flip } from "svelte/animate";
    import { quintOut } from "svelte/easing";

    // export let toasts = writable([]);
    export let toaster: Toaster = new Toaster();

    export let toast = async (message: string, level: 'info' | 'error' = 'info') => {
        let color: string;
        if (level == 'error') {
            color = 'red';
        } else if (level == 'info') {
            color = 'blue';
        } else {
            color = 'gray';
        }
        await toaster.toast({
            message,
            classes: `whitespace-nowrap block bg-${color}-400 rounded-lg p-2 text-sm`,
            timeout: 1000,
        });
    };
    
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
