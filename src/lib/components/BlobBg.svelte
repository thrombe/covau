<script lang='ts' context='module'>
    // - [seedable rng](https://stackoverflow.com/a/47593316)

    function cyrb128(str: string) {
        let h1 = 1779033703, h2 = 3144134277,
            h3 = 1013904242, h4 = 2773480762;
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
        return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
    }
    function mulberry32(a: number) {
        return function() {
          var t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    export const get_rng = (seed: string) => {
        let _seed = cyrb128(seed);

        // Only one 32-bit component hash is needed for mulberry32.
        let rand = mulberry32(_seed[0]);
        return rand;
    };

    
    let _seed: string | undefined = undefined;
    export const set_seed = (seed: string) => {
        _seed = seed;
    };
    export const get_seed = () => {
        return _seed;
    };
</script>

<script lang='ts'>
    export let count = 30;
    export let colors = ['#AB62C4', '#E35A84', '#FFACAC'];
    export let bg_color = '#4E2A69';
    export let size = 250;
    export let seed: string | undefined = undefined;

    let final_seed = seed ?? (_seed ?? Date.now().toString());

    // - [catppuccin](https://github.com/catppuccin/catppuccin#-palette)
    let catpuccin_macchiato = [
        "#f4dbd6",
        "#f0c6c6",
        "#f5bde6",
        "#c6a0f6",
        "#ed8796",
        "#ee99a0",
        "#f5a97f",
        "#eed49f",
        "#a6da95",
        "#8bd5ca",
        "#91d7e3",
        "#7dc4e4",
        "#8aadf4",
        "#b7bdf8",
        "#cad3f5",
        "#b8c0e0",
        "#a5adcb",
        "#939ab7",
        "#8087a2",
        "#6e738d",
        "#5b6078",
        "#494d64",
        "#363a4f",
        "#24273a",
        "#1e2030",
        "#181926",
    ];
    let gruvbox_dark_fg_dark = [
        "#282828",
        "#CC241D",
        "#98971A",
        "#D79921",
        "#458588",
        "#458588",
        "#B16286",
        "#689D6A",
        "#A89984",
    ];
    let gruvbox_dark_fg_bright = [
        "#928374",
        "#FB4934",
        "#B8BB26",
        "#FABD2F",
        "#83A598",
        "#D3869B",
        "#8EC07C",
        "#EBDBB2",
    ];
    let macos = [
        "#4F0D1B",
        "#912E40",
        "#504591",
        "#5197B9",
        "#16183E",
        "#925FD6",
    ];
    let macos_brighter_maybe = [
        "#65408E",
        "#E60193",
        "#F90038",
        "#FB8C40",
        "#FDAC14",
        "#CAE7FB",
        "#06A4DC",
        "#0078BD",
        "#29295B",
    ];

    // colors = macos;
    // bg_color = '#51468F';
    
    // colors = catpuccin_macchiato.slice(0, -5);
    // bg_color = catpuccin_macchiato[3];

    let canvas: HTMLCanvasElement;
    let width: number;
    let height: number;
    $: if (canvas && width && height) {
        let rand = get_rng(final_seed);
        canvas.height = height;
        canvas.width = width;

        const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

        ctx.fillStyle = bg_color;
        ctx.fillRect(0, 0, width, height);
        // ctx.filter = "blur(12px)";

        function draw_blob() {
            const radius = Math.max(rand(), 0.5) * size * 2.9 * Math.min((width / 1920), (height / 1080));
            const x = rand() * canvas.width;
            const y = rand() * canvas.height;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);

            ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
            ctx.fill();
        }

        for (let i = 0; i < count; i++) {
            draw_blob();
        }
    }
</script>

<div 
    bind:clientWidth={width}
    bind:clientHeight={height}
    class='w-full h-full relative scale-100 overflow-hidden blur-3xl scale-125'
>
    <canvas bind:this={canvas} class='w-full h-full'></canvas>
</div>
