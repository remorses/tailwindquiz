/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import EnvironmentPlugin from "vite-plugin-environment";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import { viteExternalsPlugin } from "@xmorse/deployment-utils/dist/vite-externals-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";

const NODE_ENV = JSON.stringify(process.env.NODE_ENV || "production");

export default defineConfig({
  clearScreen: false,
  define: {
    "process.env.NODE_ENV": NODE_ENV,
  },
  test: {
    pool: "threads",
    exclude: ["**/dist/**", "**/esm/**", "**/node_modules/**", "**/e2e/**"],
    poolOptions: {
      threads: {
        isolate: false,
      },
    },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    EnvironmentPlugin("all", { prefix: "PUBLIC" }),
    EnvironmentPlugin("all", { prefix: "NEXT_PUBLIC" }),

    reactRouter(),
    tsconfigPaths(),
    // viteExternalsPlugin({ externals: [] }),
    tailwindcss(),
  ],
  // build: {
  //   commonjsOptions: {
  //     transformMixedEsModules: true,
  //   },
  // },
  // legacy: {
  //   proxySsrExternalModules: true,
  // },
});
