import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof createDb>;

// Lazy initialization: create db instance only when first accessed.
// This prevents Next.js from throwing during build-time static analysis
// when DATABASE_URL is not available in the CI/build environment.
function createDb() {
  // biome-ignore lint/style/noNonNullAssertion: DATABASE_URL is required at runtime
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

let _db: DrizzleDb | undefined;

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    if (!_db) {
      _db = createDb();
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
