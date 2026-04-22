import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { addressSchema } from "@/lib/address-gate";
import { consumeClaimToken, findValidClaimToken } from "@/lib/claim-tokens";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    email: z.string().email().max(254),
    token: z.string().min(32).max(128),
    password: z.string().min(6, "A jelszónak legalább 6 karakter hosszúnak kell lennie"),
  })
  .and(addressSchema);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" },
      { status: 400 },
    );
  }

  const { email, token, password, postalCode, city, streetAddress } = parsed.data;

  try {
    const userRow = await db.query.user.findFirst({
      where: eq(user.email, email.toLowerCase()),
      columns: { id: true, email: true },
    });
    if (!userRow) {
      return Response.json({ error: "Ez a link érvénytelen vagy lejárt" }, { status: 400 });
    }

    // Defensive re-check: still a ghost (no accounts)?
    const existingAccounts = await db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, userRow.id));
    if (existingAccounts.length > 0) {
      return Response.json({ error: "Ez a fiók már aktiválva van" }, { status: 400 });
    }

    const tokenRow = await findValidClaimToken(userRow.id, token);
    if (!tokenRow) {
      return Response.json({ error: "Ez a link érvénytelen vagy lejárt" }, { status: 400 });
    }

    // Hash the password via Better Auth's internal hasher.
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(password);

    const now = new Date();
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userRow.id,
      providerId: "credential",
      userId: userRow.id,
      password: hash,
      createdAt: now,
      updatedAt: now,
    });

    await db
      .update(user)
      .set({
        emailVerified: true,
        postalCode,
        city,
        streetAddress,
        updatedAt: now,
      })
      .where(eq(user.id, userRow.id));

    await consumeClaimToken(tokenRow.id);

    // Issue a session using the stock sign-in path so cookies match normal logins.
    const signInResult = await auth.api.signInEmail({
      body: { email: userRow.email, password },
      headers: await headers(),
      asResponse: true,
    });

    // Forward the Set-Cookie headers from Better Auth
    const response = Response.json({ ok: true });
    for (const [key, value] of signInResult.headers.entries()) {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append("set-cookie", value);
      }
    }
    return response;
  } catch (err) {
    console.error("[api/auth/claim/complete] Error:", err);
    return Response.json({ error: "Hiba történt. Próbálja újra." }, { status: 500 });
  }
}
