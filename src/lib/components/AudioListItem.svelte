<script lang="ts">
    export let title: string;
    export let title_sub: string;
    export let img_src: string;

    // TODO: somehow setup retrying and see if images load more reliably

    let hide_border = true;

    $: if (img_src || true) {
        if (img_src == '') {
            hide_border = true;
        }
    }

    const on_err = async () => {
        hide_border = true;
        img_src = '/static/default-music-icon.svg';
    };

    const on_load = async () => {
        hide_border = false;
    };
</script>

<div class='w-full h-full pl-1 flex flex-row text-gray-200'>
    <icon class='block p-1 aspect-square flex-none h-full'>
        <div class='w-full h-full rounded-md overflow-hidden'>
            <img
                class='w-full h-full object-cover {hide_border ? 'scale-150' : ''}'
                src={img_src}
                draggable={false}
                alt=""
                on:error={on_err}
                on:load={on_load}
            />
        </div>
    </icon>

    <info class='flex flex-col mx-2 overflow-hidden pt-1'>
        <item-title class='flex flex-col justify-end h-1/2 text-sm'>
            <txt>{title}</txt>
        </item-title>

        <item-title-sub class='flex flex-col justify-start h-1/2 text-xs text-gray-400'>
            <txt>{title_sub}</txt>
        </item-title-sub>
    </info>
</div>

<style lang='postcss'>
    txt {
        @apply w-full text-ellipsis whitespace-nowrap overflow-hidden select-none;
    }
</style>
