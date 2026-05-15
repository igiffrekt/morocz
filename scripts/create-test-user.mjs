// One-off script: creates a test user with no billing address
// Run with: node scripts/create-test-user.mjs
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.production.local
const envFile = readFileSync(resolve(process.cwd(), ".env.production.local"), "utf-8");
const env = Object.fromEntries(
  envFile.split("\n").filter(l => l && !l.startsWith("#")).map(l => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const sql = neon(env.DATABASE_URL);

// Better Auth scrypt config (matches dist/crypto/password.mjs)
async function hashPassword(password) {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 16384, r: 16, p: 1, dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${bytesToHex(key)}`;
}

const email = "test.noaddress@example.com";
const password = "Test1234!";
const hash = await hashPassword(password);
const now = new Date();

// Upsert user (clear address fields if already exists)
await sql`
  INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at, role)
  VALUES (${crypto.randomUUID()}, 'Test Felhasználó', ${email}, true, ${now}, ${now}, 'user')
  ON CONFLICT (email) DO UPDATE SET
    postal_code = NULL, city = NULL, street_address = NULL, updated_at = ${now}
`;

const [row] = await sql`SELECT id FROM "user" WHERE email = ${email}`;
const userId = row.id;

// Replace credential account with correct hash
await sql`DELETE FROM account WHERE user_id = ${userId} AND provider_id = 'credential'`;
await sql`
  INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
  VALUES (${crypto.randomUUID()}, ${email}, 'credential', ${userId}, ${hash}, ${now}, ${now})
`;

console.log("✓ Test user ready:");
console.log("  Email:   ", email);
console.log("  Password:", password);
console.log("  User ID: ", userId);
