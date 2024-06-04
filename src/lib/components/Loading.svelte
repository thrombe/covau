<script lang="ts">
    import BlobBg from "$lib/components/BlobBg.svelte";

    let loading_msg = "Loading ..";
    let max_dots = 4;

    let _loading_msg = loading_msg;

    let count = 0;
    setInterval(() => {
        if (count == max_dots) {
            count = 0;
        } else {
            _loading_msg = loading_msg + '.'.repeat(count);
            count += 1;
        }
    }, 500);
</script>


<div class='relative w-full h-full'>
    <div class='covered text-[3rem] text-gray-200 font-bold flex flex-col justify-center items-center bg-gray-900 bg-opacity-30'>
        <div class='h-30 block p-4' style="width: 310px;">
            {_loading_msg}
        </div>
    </div>

    <div class='w-full h-full brightness-50'>
        <BlobBg
            animate={false}
        />
    </div>
    <div class=' grainy grainy-bg'></div>
</div>

<style lang='postcss'>
    .covered {
        @apply absolute z-10 left-0 top-0 h-full w-full;
    }
</style>
