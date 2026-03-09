import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

const UpdatePhoneSchema = z.object({
  phoneNumber: z.string().min(10, "Telefonszám legalább 10 számjegy"),
});

export async function POST(request: Request): Promise<Response> {
  // Auth check
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Kérjük, jelentkezzen be." }, { status: 401 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés törzs." }, { status: 400 });
  }

  const parsed = UpdatePhoneSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
    return Response.json({ error: firstError }, { status: 400 });
  }

  const { phoneNumber } = parsed.data;

  try {
    // Update user's phoneNumber in database
    await db
      .update(user)
      .set({ phoneNumber: phoneNumber.trim() })
      .where(eq(user.id, session.user.id));

    return Response.json(
      { success: true, message: "Telefonszám sikeresen mentve." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/user/phone] Update failed:", err);
    return Response.json(
      { error: "Hiba történt a telefonszám mentésekor." },
      { status: 500 },
    );
  }
}
