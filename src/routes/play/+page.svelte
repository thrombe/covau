<script lang="ts">

  let src_url = "";
  let progress = 0;
  let yt_id = "";

  let on_audio_load = async () => {
    console.log("audio loaded");
  };
  let seeked = async () => {
    console.log("audio loaded");
  };
	let get_audio_uri = async () => {
    let r = await fetch("/functions/get_audio_uri",
        {
            method: "post",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"yt_id": yt_id}),
        }
    );
		let e = await r.json();
		console.log(r, e);
    src_url = e.uri;
	};
</script>


<input bind:value={yt_id} />
<button on:click={get_audio_uri} >play</button>
<audio src={src_url} on:load={on_audio_load} bind:duration={progress} on:seeked={seeked} controls />
