import { svelte } from "@sveltejs/vite-plugin-svelte";

export default {
    plugins: [svelte()],
    root: "src",
    base: "./",
    build: {
        outDir: "../docs",
        emptyOutDir: true,
        rollupOptions: {
            input: "./src/index.html", // Explicitly set the entry point
        },
    },
    server: {
        open: "/index.html",
    },
};
