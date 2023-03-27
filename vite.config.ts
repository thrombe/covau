import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		minify: false,
		// minifySyntax: false,
	},
	plugins: [sveltekit()]
});
