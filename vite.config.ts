import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		minify: false,
		// minifySyntax: false,
	},
    server: {
        port: 5178
    },
	plugins: [sveltekit()]
});
