<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Innertube, UniversalCache } from 'youtubei.js/web';

	let src_url = '';
	let progress = 0;
	let yt_id = 'AjesoBGztF8';

	fetch("/.netlify/functions/ollo").then(e => console.log(e))

	let yt: Innertube;
	let f = async () => {
		yt = await Innertube.create({
			cache: new UniversalCache(false),
			generate_session_locally: true,
			fetch: async (input, init) => {
				// console.log(input);
				// url
				const url =
					typeof input === 'string'
						? new URL(input)
						: input instanceof URL
						? input
						: new URL(input.url);
				// console.log(url);
				let url_copy = url.toString();

				url.protocol = 'http';

				const headers = init?.headers
					? new Headers(init.headers)
					: input instanceof Request
					? input.headers
					: new Headers();
				let headers_copy = JSON.stringify([...headers]);

				// now serialize the headers
				// url.searchParams.set('__headers', JSON.stringify([...headers]));

				// @ts-ignore
				// input.duplex = 'half';

				// copy over the request
				const request = new Request(
					url,
					// to_dash(url_copy),
					input instanceof Request ? input : undefined
				);

				headers.delete('user-agent');

				// let headers_and_stuff = init
				// 	? {
				// 			...init,
				// 			headers
				// 	  }
				// 	: {
				// 			headers
				// 	  };
				// console.log(await request.arrayBuffer());
				// let body = await request.body?.getReader().read();
				let req = {
					url: url_copy,
					headers: headers_copy,
					body: init?.body,
					method: request.method
				};
				// console.log(req, headers_and_stuff);
				// fetch the url
				// let _res = await fetch(request, headers_and_stuff);
				// return _res;

				let res = await fetch('/.netlify/functions/fetch', {
					method: 'post',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(req)
				});
				console.log('T-T');
				console.log(res);

				return res;
			}
		});
		// let k = await yt.getInfo(yt_id);
		// console.log(k);
	};
	f();

	const yo = async () => {
		
	};

    let video: any;
    let player: YT.Player;
    const do_somethin = () => {
        console.log(video);

        // - [Play iFrame embedded YouTube Video on click](https://codepen.io/martinwolf/pen/DrPWXw)
        // - [Control yt Video Player with js](https://tutorialzine.com/2015/08/how-to-control-youtubes-video-player-with-javascript)
        // - [Control yt Video Player with js](https://demo.tutorialzine.com/2015/08/how-to-control-youtubes-video-player-with-javascript/)
        // this YT thing comes from the youtube iframe api script
        // - [youtube.d.ts File for the youtube-iframe-api](https://stackoverflow.com/questions/42352944/youtube-d-ts-file-for-the-youtube-iframe-api-to-use-in-angular-2-needed)
        player = new YT.Player('video', {
            width: 0,
            height: 0,
            videoId: 'KZvVWnRUrkU',
            playerVars: {
                color: 'white',
                controls: 0,
                // autoplay: 1,
                showinfo: 0,
                disablekb: 1,
                modestbranding: 1,
                playlist: 'KZvVWnRUrkU,vJnCiySv1Nw'
            },
            events: {
                onReady: (eve: any) => {
                    console.log(player);
                    // player.playVideo();
                    eve.target.playVideo();
                    eve.target.playVideo();
                    // let newTime = player.getDuration() * (40 / 100);
                    // player.seekTo(newTime);
                }
            }
        });
    };
    $: if (video) {
        // do_somethin();
    }
    let pos = 0;

    onDestroy(() => {
        if (player) {
            player.destroy();
        }
    })
</script>

<input bind:value={yt_id} />
<button on:click={yo} >yo</button>
<button on:click={do_somethin} >bo</button>




<svelte:head>
    <script src="https://www.youtube.com/iframe_api"></script>
</svelte:head>

<button on:click={do_somethin}>start player</button>

<button
    on:click={() => {
        console.log(player);
        player.seekTo(100, true);
        player.playVideo();
        setTimeout(() => {
            console.log('yaaaaaaaaaaaaaaaaah');
            player.nextVideo();
            setTimeout(() => {
                player.seekTo(50, true);
            }, 5000);
        }, 5000);
    }}
>
    seek
</button>
<div bind:this={video} id="video" />
<input
    type="range"
    on:mousedown={() => {}}
    on:mouseup={() => {}}
    on:change={() => {}}
    bind:value={pos}
    min="0"
    max="100"
/>
