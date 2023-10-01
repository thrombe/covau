<script lang='ts'>
    import BlobBg from '$lib/components/BlobBg.svelte';
    import InputBar from '$lib/components/InputBar.svelte';
    import { nanoid } from 'nanoid';

    let group: string;

    const on_room_enter = async (group: string) => {
        let url_without_hash = window.location.toString().replace(window.location.hash, '');
        let new_url = url_without_hash + '#/vibe/' + group;
        window.history.pushState({}, '', new_url);
        window.location.reload();
    };

    const random_room = async () => {
        let group = nanoid(10);
        await on_room_enter(group);
    };
</script>

<div class='relative w-full h-full flex flex-col bg-gray-900 bg-opacity-30'>
    <div class='w-full h-full flex items-center justify-center'>
        <div class='relative flex flex-col w-[60%] overflow-hidden rounded-3xl py-6 px-8 gap-6'>
            <div class='px-6 text-2xl w-full text-center'>
                Join / Create a room
            </div>
            <div class='w-full h-full bg-gray-900 bg-opacity-30 rounded-3xl p-4'>
                <InputBar
                    bind:value={group}
                    placeholder='Enter Room Name'
                    on_enter={() => on_room_enter(group)}
                />
            </div>

            <div class='px-6 text-2xl w-full text-center'>
                Or
            </div>

            <div class='w-full'>
                <button 
                    class='p-4 bg-gray-200 bg-opacity-20 rounded-3xl w-full text-gray-200 text-xl font-bold'
                    on:click={random_room}
                >
                    Create a random room
                </button>
            </div>

            <div class='absolute h-full w-full left-0 top-0 -z-20 brightness-[90%]'>
                <BlobBg
                    colors={[
                        "#4F0D1B",
                        "#912E40",
                        "#504591",
                        "#5197B9",
                        "#16183E",
                        "#925FD6",
                    ]}
                    animate={false}
                />
            </div>
            <div class='-z-20 grainy grainy-bg'></div>
        </div>
    </div>

    <div class='w-full h-full absolute -z-30 brightness-50'>
        <BlobBg
            animate={false}
        />
    </div>
    <div class='-z-20 grainy grainy-bg'></div>
</div>
