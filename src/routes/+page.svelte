<script lang="ts">

	let f = async () => {
		let r = await fetch("/.netlify/functions/hello");
		let e = r.text();
		console.log(r, e);
	};
	let f2 = async () => {
		let r = await fetch("/.netlify/functions/hello2");
		let e = r.text();
		console.log(r, e);
	};
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<a style={"background-color: #282828;"} href="/play">play</a>
<a style={"background-color: #282828;"} href="/play_iframe">play iframe</a>
<a style={"background-color: #282828;"} href="/fiarebase_test">fiarebase test</a>
<button on:click={f} >ts</button>
<button on:click={f2} >js</button>

<section>
	<h1>
		to your new<br />SvelteKit app
	</h1>

	<h2>
		try editing <strong>src/routes/+page.svelte</strong>
	</h2>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>
