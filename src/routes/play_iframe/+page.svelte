<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Innertube, UniversalCache } from 'youtubei.js/web';

	let src_url = '';
	let progress = 0;
	let yt_id = 'AjesoBGztF8';

	// fetch('/.netlify/functions/ollo').then((e) => console.log(e));

	let yt: Innertube;
	let f = async () => {
		yt = await Innertube.create({
			cache: new UniversalCache(false),
			generate_session_locally: true,
			fetch: async (input, init) => {
				let url: string;
				if (typeof input === 'string') {
					url = input;
				} else if (input instanceof URL) {
					url = input.toString();
				} else {
					url = input.url;
				}

				let headers = init?.headers
					? new Headers(init.headers)
					: input instanceof Request
					? input.headers
					: new Headers();
				let headers_copy = JSON.stringify([...headers]);

				headers.delete('user-agent');

				const request = new Request(
					url,
					input instanceof Request ? input : undefined
				);
				let req = {
					url: url,
					headers: headers_copy,
					body: init?.body,
					method: request.method
				};
				let res = await fetch('/.netlify/functions/fetch', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(req)
				});
				return res;
			}
		});
		console.log(await yt.getBasicInfo('vJnCiySv1Nw'))
	};
	f();

	const yo = async () => {};

	let video: any;
	let player: YT.Player;
	const do_somethin = () => {
		console.log(video);

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
	});
</script>

<input bind:value={yt_id} />
<button on:click={f}>f</button>
<button on:click={yo}>yo</button>
<button on:click={do_somethin}>bo</button>

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
