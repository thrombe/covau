<script lang='ts'>
    export let count = 30;
    export let colors = ['#AB62C4', '#E35A84', '#FFACAC'];
    export let bg_color = '#4E2A69';
    export let animate = true;
</script>

<div 
    class='w-full h-full relative blur-xl scale-125 overflow-hidden'
    style='
        background: {bg_color};
    '
>
    {#each Array(count).keys() as k (k)}
        <div
            class='absolute rounded-full blob'
            style='
                --duration: {Math.max(400 * Math.random(), 30)}s;
                --color: {colors[Math.floor(Math.random() * colors.length)]};
                --size: {250 * Math.random()}px;
                --xpos: {1.0 - 2.0*Math.random()};
                --ypos: {1.0 - 2.0*Math.random()};
                --xorigin: {2 * (-1.0 + 2.0*Math.max(Math.random(), 0.0))};
                --yorigin: {2 * (-1.0 + 2.0*Math.max(Math.random(), 0.0))};
                --delay: {-100 * Math.random()}s;
                --clock: {animate ? (Math.random() > 0.5 ? 1 : -1) : 0};
            '
        ></div>
    {/each}
</div>

<style>
    @keyframes move {
        100% {
            transform: translate3d(0, 0, 1px) rotate(calc(var(--clock) * 360deg));
        }
    }

    .blob {
        position: absolute;
        animation: move;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        will-change: transform;

        background-color: var(--color);
        padding: var(--size);
        animation-duration: var(--duration);
        translate: -50% 50%;
        bottom: calc(50% + 50% * var(--ypos));
        left: calc(50% + 50% * var(--xpos));
        animation-delay: var(--delay);
        transform-origin: calc(50% + 50% * var(--xorigin)) calc(50% + 50% * var(--yorigin));
    }
</style>
