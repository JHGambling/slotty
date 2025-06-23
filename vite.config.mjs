import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  plugins: [svelte()],
  root: 'src',
  base: './',
  build: {
    outDir: '../docs',
    emptyOutDir: true
  },
  server: {
    open: '/index.html',
  },
};
