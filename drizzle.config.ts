import { defineConfig } from "drizzle-kit";
import { readConfig } from "./src/config";

const cfg = readConfig();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: cfg.dbUrl,
  },
});