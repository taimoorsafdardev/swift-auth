import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],   // main entry point
  format: ["esm", "cjs"],    // generate both ESM and CommonJS
  dts: true,                 // generate TypeScript declaration files
  sourcemap: true,           // optional: generate source maps
  clean: true,               // clean the dist folder before building
  outDir: "dist",            // output folder
  target: "ES2021",          // JS target version
  splitting: false,          // for libraries, usually false
  minify: false,             // don't minify for library builds
  external: ["@upstash/redis", "zod"] // don't bundle dependencies
});
