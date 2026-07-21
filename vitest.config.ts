import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json-summary"],
      include: ["src/stores/**", "src/services/**", "src/ipc/**"],
    },
  },
});
