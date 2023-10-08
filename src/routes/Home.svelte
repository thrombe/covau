<script lang='ts'>
    import BlobBg, { get_seed } from '$lib/components/BlobBg.svelte';
    import InputBar from '$lib/components/InputBar.svelte';
    import { nanoid } from 'nanoid';

    let group: string;
    let seed = get_seed();

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

<div class='relative w-full h-full flex flex-col gap-6 justify-center items-center bg-gray-900 bg-opacity-30'>
    <div class='w-[80%] md:w-[60%] xl:w-[40%] flex flex-col items-center justify-center'>
        <div class='relative flex flex-col items-center w-full overflow-hidden rounded-3xl py-6 px-4 md:px-8 gap-2'>
            <div class='px-3 md:px-6 text-[1.2rem] md:text-[1.5rem] w-full text-center'>
                Welcome to the Home page of Covau!
            </div>
            <div class='px-3 md:px-6 text-md w-full'>
                Covau is a webapp for enjoying music and videos with friends in real-time.
            </div>
            <a href='https://github.com/thrombe/covau' target='_blank' class='px-6'>
                <img src='/static/github.svg' class='h-8 aspect-square' >
            </a>

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
                    seed={seed + '1'}
                />
            </div>
            <div class='-z-20 grainy grainy-bg'></div>
        </div>
    </div>

    <div class='w-[80%] md:w-[60%] xl:w-[40%] flex flex-col items-center justify-center'>
        <div class='relative flex flex-col w-full overflow-hidden rounded-3xl py-6 px-4 md:px-8 gap-3 md:gap-6'>
            <div class='px-3 md:px-6 text-xl md:text-2xl w-full text-center'>
                Join / Create a room
            </div>
            <div class='w-full h-full bg-gray-900 bg-opacity-30 rounded-3xl p-4'>
                <InputBar
                    bind:value={group}
                    placeholder='Enter Room Name'
                    on_enter={() => on_room_enter(group)}
                />
            </div>

            <div class='px-3 md:px-6 text-xl md:text-2xl w-full text-center'>
                Or
            </div>

            <div class='w-full'>
                <button 
                    class='p-4 bg-gray-200 bg-opacity-20 rounded-3xl w-full text-gray-200 text-[1.1rem] md:text-xl font-bold'
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
                    seed={seed + '2'}
                />
            </div>
            <div class='-z-20 grainy grainy-bg'></div>
        </div>
    </div>

    <div class='w-full h-full absolute -z-30 brightness-50'>
        <BlobBg
            seed={seed + '3'}
        />
    </div>
    <div class='-z-20 grainy grainy-bg'></div>
</div>
