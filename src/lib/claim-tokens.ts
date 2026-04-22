import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { verification } from "@/lib/db/schema";

const CLAIM_TTL_MS = 60 * 60 * 1000; // 60 minutes

export function claimIdentifier(userId: string): string {
  return `claim:${userId}`;
}

export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function insertClaimToken(userId: string, rawToken: string): Promise<void> {
  const now = new Date();
  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier: claimIdentifier(userId),
    value: hashToken(rawToken),
    expiresAt: new Date(now.getTime() + CLAIM_TTL_MS),
    createdAt: now,
    updatedAt: now,
  });
}

/** Returns the verification row if the (userId, token) pair is valid and unexpired. */
export async function findValidClaimToken(userId: string, rawToken: string) {
  const row = await db.query.verification.findFirst({
    where: and(
      eq(verification.identifier, claimIdentifier(userId)),
      eq(verification.value, hashToken(rawToken)),
      gt(verification.expiresAt, new Date()),
    ),
  });
  return row ?? null;
}

export async function consumeClaimToken(rowId: string): Promise<void> {
  await db.delete(verification).where(eq(verification.id, rowId));
}
