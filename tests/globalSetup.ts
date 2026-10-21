import { execSync } from "node:child_process";
import dotenv from "dotenv";

export async function setup() {
  dotenv.config({ path: ".env.test", override: true });
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
}
