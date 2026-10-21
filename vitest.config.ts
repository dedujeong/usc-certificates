import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    setupFiles: ["./tests/setupEnv.ts"],
    globalSetup: ["./tests/globalSetup.ts"],
    // API/service tests hit a real Postgres test database and share
    // Prisma connections/sequences, so they run sequentially to avoid
    // cross-test interference (e.g. the tuition-sequence race test).
    fileParallelism: false,
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
