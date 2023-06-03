import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default defineConfig({
	build: {
		outDir: 'build'
	},
	server: {
		port: 5178
	},
	plugins: [
		svelte({
			/* plugin options */
		})
	]
});