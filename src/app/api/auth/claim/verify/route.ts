import { eq } from "drizzle-orm";
import { z } from "zod";
import { findValidClaimToken } from "@/lib/claim-tokens";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  token: z.string().min(32).max(128),
  email: z.string().email().max(254),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    token: url.searchParams.get("token"),
    email: url.searchParams.get("email"),
  });
  if (!parsed.success) {
    return Response.json({ valid: false }, { status: 400 });
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const userRow = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { id: true },
    });
    if (!userRow) {
      return Response.json({ valid: false });
    }

    const tokenRow = await findValidClaimToken(userRow.id, parsed.data.token);
    return Response.json({ valid: !!tokenRow });
  } catch (err) {
    console.error("[api/auth/claim/verify] Error:", err);
    return Response.json({ valid: false }, { status: 500 });
  }
}
