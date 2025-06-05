import { svelte } from '@sveltejs/vite-plugin-svelte';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [svelte()],
  root: 'src',
  build: {
    outDir: '../public',
    emptyOutDir: true
  },
  server: {
    open: '/index.html',
  },
};
