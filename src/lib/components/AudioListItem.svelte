<script lang="ts">
    export let title: string;
    export let title_sub: string;
    export let img_src: string;

    // TODO: somehow setup retrying and see if images load more reliably
</script>

<boxx>
    <icon>
        <img src={img_src} alt="" />
    </icon>

    <info>
        <item-title>
            <txt>{title}</txt>
        </item-title>

        <item-title-sub>
            <txt>{title_sub}</txt>
        </item-title-sub>
    </info>
</boxx>

<style>
    * {
        --info-left-right-margin: 10px;
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    icon {
        width: var(--list-item-icon-width);
    }

    info {
        width: calc(100% - var(--list-item-icon-width) - var(--info-left-right-margin) * 2);
        margin-right: var(--info-left-right-margin);
        margin-left: var(--info-left-right-margin);

        display: flex;
        flex-direction: column;
    }

    item-title {
        display: block;
        height: 60%;

        display: flex;
        flex-direction: column;
        justify-content: end;

        font-size: calc(var(--list-item-icon-width) * 0.2);
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        flex-wrap: nowrap;
    }

    txt {
        width: 100%;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        user-select: none;
    }

    item-title-sub {
        display: block;
        height: 40%;

        display: flex;
        flex-direction: column;
        justify-content: start;

        font-size: calc(var(--list-item-icon-width) * 0.15);
    }

    boxx {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: row;
    }
</style>
