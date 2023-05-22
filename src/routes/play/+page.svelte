<script lang="ts">
	import { onMount } from "svelte";
  import { Innertube, UniversalCache } from "youtubei.js/web";
  import { MediaPlayer } from "dashjs";
	import type { Format } from "youtubei.js/dist/src/parser/misc";



  let src_url = "";
  let progress = 0;
  let yt_id = "AjesoBGztF8";

  let on_audio_load = async () => {
    console.log("audio loaded");
  };
  let seeked = async () => {
    console.log("audio loaded");
  };
	let get_audio_uri = async () => {
    let r = await fetch("/.netlify/functions/get_audio_uri",
        {
            method: "post",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"yt_id": yt_id}),
        }
    );
		let e = await r.json();
		console.log(r, e);
    // src_url = e.uri;
    src_url = to_dash(e.uri).toString();
	};

  let yt: any;
  let f = async () => {
    yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
       fetch: async (input, init) => {
            // console.log(input);
            // url
            const url = typeof input === 'string'
              ? new URL(input)
              : input instanceof URL
                ? input
                : new URL(input.url);
            // console.log(url);
            let url_copy = url.toString();

            // transform the url for use with our proxy
            url.searchParams.set('__host', url.host);
            url.host = 'localhost:8080';
            // url.host = '/functions/fetch';
            // url.host = 'fetch';
            url.protocol = 'http';

            const headers = init?.headers
              ? new Headers(init.headers)
              : input instanceof Request
                ? input.headers
                : new Headers();
            let headers_copy = JSON.stringify([...headers]);

            // now serialize the headers
            url.searchParams.set('__headers', JSON.stringify([...headers]));

            // @ts-ignore
            input.duplex = 'half';

            // copy over the request
            const request = new Request(
              // url,
              to_dash(url_copy),
              input instanceof Request ? input : undefined,
            );

            headers.delete('user-agent');

            let headers_and_stuff = init ? {
              ...init,
              headers
            } : {
              headers
            };
            console.log(await request.arrayBuffer());
            let body = await request.body?.getReader().read();
            let req = {
              url: url_copy,
              headers: headers_copy,
              body: init?.body,
              method: request.method,
            }
            console.log(req, headers_and_stuff);
            // fetch the url
            let _res = fetch(request, headers_and_stuff);
            return _res;

            let res = await fetch("/fetch",
                {
                    method: "post",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(req),
                }
            );
            console.log("T-T");
            console.log(res);
            
            return res;
          },
    });
    let k = await yt.getInfo(yt_id);
    // let uri = k.streaming_data?.adaptive_formats[k.streaming_data?.adaptive_formats.length - 1].decipher(yt.session.player);
    // console.log(k.streaming_data?.adaptive_formats,  uri);
    console.log(k);
  };

  let to_dash = (url: any) => {
    let u = new URL("http://localhost:8888/fetch");
    // let u = new URL("https://covau.netlify.app/fetch");
    u.searchParams.set("__url", url.toString());
    console.log(url.toString());
    console.log(u.toString());
    return u;
    // return "http://localhost:8888/fetch?__url=" + url.toString();
  };
  let filter_formats = (format: Format): boolean => {
    console.log(format);
    return !format.mime_type.includes("audio") ;
    if (format.mime_type.includes("audio")) {
      return false;
    }
    return true;
  };

  let player: any;
  onMount(async () => {
      await f();
      let info = await yt.getInfo(yt_id);

      let video_element = document.querySelector('video') as HTMLVideoElement;
      video_element.setAttribute('controls', 'true');
      video_element.poster = info.basic_info.thumbnail![0].url;

      // let dash = await info.toDash(to_dash, filter_formats);
     let r = await fetch("/.netlify/functions/get_dash",
          {
              method: "post",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({"yt_id": yt_id}),
          }
      );
  		let e = await r.json();
      let dash = e.dash;
      let uri = 'data:application/dash+xml;charset=utf-8;base64,' + btoa(dash);

      player = MediaPlayer().create();
      player.initialize(video_element, uri, true);
  });


  let dash_play = async () => {
      let info = await yt.getInfo(yt_id);
      let dash = await info.toDash(to_dash, filter_formats);
      let uri = 'data:application/dash+xml;charset=utf-8;base64,' + btoa(dash);
    player.attachSource(uri);
    player.play();
  };
</script>


<input bind:value={yt_id} />
<button on:click={dash_play} >dash play</button>
<button on:click={get_audio_uri} >play</button>
<audio src={src_url} on:load={on_audio_load} bind:duration={progress} on:seeked={seeked} controls />
<video />
