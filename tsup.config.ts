import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "index.ts",
    react: "react/index.ts",
    theme: "theme/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: ["react", "react-dom", "konva", "react-konva", "react-konva-utils"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
