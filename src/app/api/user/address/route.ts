import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { addressSchema } from "@/lib/address-gate";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return Response.json({ error: "Nincs hitelesítve" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" },
        { status: 400 },
      );
    }

    const { postalCode, city, streetAddress } = parsed.data;

    await db
      .update(user)
      .set({ postalCode, city, streetAddress, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[api/user/address] Error:", err);
    return Response.json({ error: "Hiba történt a cím mentésekor" }, { status: 500 });
  }
}
