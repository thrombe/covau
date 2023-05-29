<script lang="ts">
    import { tick } from 'svelte';

    export let enter_screen: () => void | Promise<void> = async () => {};
    export let leave_screen: () => void | Promise<void> = async () => {};

    export let margin: number;

    export let visible: Boolean | null = null;
    export let root: HTMLElement | null = null;

    const on_intersect = async (entries: any) => {
        if (entries[0].isIntersecting) {
            visible = true;
            await enter_screen();
        } else {
            visible = false;
            await leave_screen();
        }
    };

    function observe(node: any) {
        observer && observer.observe(node);
        return {
            destroy() {
                observer && observer.unobserve(node);
            }
        };
    }
    // $: console.log(visible);

    let show = false;
    let unshow_and_show = async () => {
        show = false;
        await tick();
        show = true;
    };

    $: observer = new IntersectionObserver(on_intersect, {
        rootMargin: '' + margin + 'px',
        root: root
    });

    // the element must be reshown whenever margin or root changes
    $: if (margin || root) {
        unshow_and_show();
    }
</script>

{#key margin || root}
    <p use:observe />
{/key}

<style>
    p {
        z-index: 5;
    }
</style>

