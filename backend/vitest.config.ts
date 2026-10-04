import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/setupEnv.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30000,
    globals: false,
  },
});
