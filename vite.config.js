import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";
import analyzer from "vite-bundle-analyzer";

export default defineConfig({
    plugins: [
        preact(),
        analyzer({
            analyzerMode: "disabled",
            inject: false,
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "src/main.ts"),
            name: "ObsidianPreactTemplate",
            fileName: "main",
            formats: ["cjs"],
        },
        rollupOptions: {
            external: [
                "obsidian",
                "fs",
                "os",
                "path",
                "@codemirror/language",
                "@codemirror/state",
                "@codemirror/view",
            ],
            output: {
                exports: "default",
                entryFileNames: "[name].js",
            },
        },
        outDir: ".",
        emptyOutDir: false,
        sourcemap: "inline",
        minify: true,
        watch: {},
    },
    resolve: {
        alias: {
            react: "preact/compat",
            "react-dom/test-utils": "preact/test-utils",
            "react-dom": "preact/compat",
            "react/jsx-runtime": "preact/jsx-runtime",
            src: resolve(__dirname, "src"),
        },
    },
});
