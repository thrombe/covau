<script lang="ts">
    export let title: string;
    export let title_sub: string;
    export let img_src: string;

    // TODO: somehow setup retrying and see if images load more reliably
</script>

<div class='w-full h-full pl-1 flex flex-row text-gray-200'>
    <icon class='block p-1 aspect-square flex-none h-full'>
        <div class='w-full h-full rounded-md overflow-hidden'>
            <img class='w-full h-full object-cover scale-[101%]' src={img_src} alt="" />
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
