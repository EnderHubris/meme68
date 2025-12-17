import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // Use static adapter for NGINX
    adapter: adapter({
      // default options
      pages: 'build',       // where to output HTML
      assets: 'build',      // where to output static assets
      fallback: 'index.html' // SPA fallback for client-side routing
    }),
  }
};

export default config;
