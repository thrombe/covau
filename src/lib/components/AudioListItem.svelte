<script lang="ts">
    export let title: string;
    export let title_sub: string;
    export let img_src: string;

    // TODO: somehow setup retrying and see if images load more reliably
</script>

<div class='w-full h-full flex flex-row text-gray-200'>
    <icon>
        <img class='w-full h-full object-cover' src={img_src} alt="" />
    </icon>

    <info class='flex flex-col'>
        <item-title class='flex flex-col justify-end'>
            <txt>{title}</txt>
        </item-title>

        <item-title-sub class='flex flex-col justify-start'>
            <txt>{title_sub}</txt>
        </item-title-sub>
    </info>
</div>

<style lang='postcss'>
    * {
        --info-left-right-margin: 10px;
    }

    icon {
        width: var(--list-item-icon-width);
    }

    info {
        width: calc(100% - var(--list-item-icon-width) - var(--info-left-right-margin) * 2);
        margin-right: var(--info-left-right-margin);
        margin-left: var(--info-left-right-margin);
    }

    item-title {
        height: 60%;
        font-size: calc(var(--list-item-icon-width) * 0.2);
    }

    txt {
        @apply w-full text-ellipsis whitespace-nowrap overflow-hidden select-none;
    }

    item-title-sub {
        height: 40%;
        font-size: calc(var(--list-item-icon-width) * 0.15);
    }
</style>
