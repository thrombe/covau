import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
import tsconfig from "./tsconfig.json";
// import preprocess from 'svelte-preprocess';

const tsconfigPathAliases = Object.fromEntries(
	Object.entries(tsconfig.compilerOptions.paths).map(([key, values]) => {
		let value = values[0];
		if (key.endsWith("/*")) {
			key = key.slice(0, -2);
			value = value.slice(0, -2);
		}

		const nodeModulesPrefix = "node_modules/";
		if (value.startsWith(nodeModulesPrefix)) {
			value = value.replace(nodeModulesPrefix, "");
		} else {
			value = path.resolve(value);
		}

		return [key, value];
	})
);

export default defineConfig({
	build: {
		outDir: 'build'
	},
	server: {
		port: 5178
	},
	resolve: {
		alias: tsconfigPathAliases,
	},
	plugins: [
		svelte({
			/* plugin options */
		})
	]
});