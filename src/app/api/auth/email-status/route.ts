import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";

const emailStatusHits = new Map<string, { count: number; resetAt: number }>();
const EMAIL_STATUS_WINDOW_MS = 60_000;
const EMAIL_STATUS_MAX = 10;

function checkEmailStatusRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = emailStatusHits.get(ip);
  if (!entry || entry.resetAt < now) {
    emailStatusHits.set(ip, { count: 1, resetAt: now + EMAIL_STATUS_WINDOW_MS });
    return true;
  }
  if (entry.count >= EMAIL_STATUS_MAX) return false;
  entry.count++;
  return true;
}

export const dynamic = "force-dynamic";

const querySchema = z.object({
  email: z.string().email().max(254),
});

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!checkEmailStatusRateLimit(ip)) {
    return Response.json({ error: "Túl sok kérés" }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ email: url.searchParams.get("email") });
  if (!parsed.success) {
    return Response.json({ error: "Érvénytelen e-mail cím" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  try {
    const userRow = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { id: true },
    });

    if (!userRow) {
      return Response.json({ status: "new" });
    }

    const accounts = await db
      .select({ providerId: account.providerId })
      .from(account)
      .where(eq(account.userId, userRow.id));

    if (accounts.length === 0) {
      return Response.json({ status: "ghost" });
    }

    const hasCredential = accounts.some((a) => a.providerId === "credential");
    return Response.json({ status: hasCredential ? "credential" : "oauth" });
  } catch (err) {
    console.error("[api/auth/email-status] Error:", err);
    return Response.json({ error: "Hiba történt" }, { status: 500 });
  }
}
