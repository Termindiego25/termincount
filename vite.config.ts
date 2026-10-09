import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [sveltekit({
		adapter: adapter({ out: 'build', precompress: true }),
		preprocess: vitePreprocess(),
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self'],
				'img-src': ['self', 'data:'],
				'font-src': ['self', 'data:'],
				'connect-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none']
			}
		}
	})],
	server: {
		host: '127.0.0.1',
		port: 8765,
		strictPort: false
	},
	preview: {
		host: '127.0.0.1',
		port: 4173
	}
});
