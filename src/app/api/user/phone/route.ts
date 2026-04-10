import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10,}$/, "Telefonszám: minimum 10 számjegy"),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return Response.json({ error: "Nincs hitelesítve" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = phoneSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Érvénytelen telefonszám" },
        { status: 400 },
      );
    }

    const { phoneNumber } = parsed.data;

    // Update phone number directly via drizzle
    await db
      .update(user)
      .set({ phoneNumber })
      .where(eq(user.id, session.user.id));

    return Response.json({ success: true, phoneNumber }, { status: 200 });
  } catch (err) {
    console.error("[api/user/phone] Error:", err);
    return Response.json({ error: "Hiba történt a telefon mentésekor" }, { status: 500 });
  }
}
