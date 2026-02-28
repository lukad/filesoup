import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [solid()],
  server: {
    proxy: {
      "^/files": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/fallback/, ""),
      },
    },
  },
  resolve: {
    alias: {
      webtorrent: fileURLToPath(
        new URL(
          "./node_modules/webtorrent/dist/webtorrent.min.js",
          import.meta.url
        )
      ),
    },
  },
});
