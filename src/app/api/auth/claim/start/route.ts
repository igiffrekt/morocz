import { eq } from "drizzle-orm";
import { z } from "zod";
import { buildClaimActivationEmail } from "@/lib/auth-email";
import { generateRawToken, insertClaimToken } from "@/lib/claim-tokens";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";
import { isEmailConfigured, sendEmail } from "@/lib/email";

const claimStartHits = new Map<string, { count: number; resetAt: number }>();
const CLAIM_START_WINDOW_MS = 600_000; // 10 minutes
const CLAIM_START_MAX = 3;

function checkClaimStartRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = claimStartHits.get(ip);
  if (!entry || entry.resetAt < now) {
    claimStartHits.set(ip, { count: 1, resetAt: now + CLAIM_START_WINDOW_MS });
    return true;
  }
  if (entry.count >= CLAIM_START_MAX) return false;
  entry.count++;
  return true;
}

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(254),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!checkClaimStartRateLimit(ip)) {
    return Response.json({ error: "Túl sok kérés" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Érvénytelen e-mail cím" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  try {
    const userRow = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { id: true },
    });

    // Always return ok to prevent enumeration. Do the real work only if ghost.
    if (userRow) {
      const accounts = await db
        .select({ id: account.id })
        .from(account)
        .where(eq(account.userId, userRow.id));

      if (accounts.length === 0) {
        const rawToken = generateRawToken();
        await insertClaimToken(userRow.id, rawToken);

        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
        const link = `${baseUrl}/claim/complete?token=${rawToken}&email=${encodeURIComponent(email)}`;

        if (isEmailConfigured()) {
          try {
            await sendEmail({
              to: email,
              subject: "Fejezze be a fiók aktiválását",
              html: buildClaimActivationEmail({ claimUrl: link }),
            });
          } catch (err) {
            console.error("[claim/start] Email send failed for", email, err);
          }
        } else {
          console.warn("[claim/start] Email not configured; claim link:", link);
        }
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/auth/claim/start] Error:", err);
    // Still return ok to avoid leaking state through timing/error differences.
    return Response.json({ ok: true });
  }
}
