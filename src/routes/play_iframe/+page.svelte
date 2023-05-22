<script lang="ts">
	import { Innertube, UniversalCache } from 'youtubei.js/web';

	let src_url = '';
	let progress = 0;
	let yt_id = 'AjesoBGztF8';

	fetch("/.netlify/functions/ollo").then(e => console.log(e))

	let yt: any;
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
		let k = await yt.getInfo(yt_id);
		console.log(k);
	};

	let player: any;
</script>

<input bind:value={yt_id} />
<button on:click={f} >yo</button>
