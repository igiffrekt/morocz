import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

const HoldSlotSchema = z.object({
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátum."),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont."),
});

export async function POST(request: Request): Promise<Response> {
  try {
    // ── 1. Validate request body ───────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Érvénytelen kérés törzs." }, { status: 400 });
    }

    const parsed = HoldSlotSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { slotDate, slotTime } = parsed.data;

    // ── 2. Generate slot lock ID and calculate hold expiration (5 minutes) ─────
    const slotLockDocId = `slotLock-${slotDate}-${slotTime.replace(":", "-")}`;
    const heldUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // ── 3. Get session (optional for tracking, but not required for hold) ──────
    const session = await auth.api.getSession({ headers: await headers() });

    // ── 4. Create or update slot lock with "held" status ────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lockData: any = {
      _id: slotLockDocId,
      _type: "slotLock",
      slotId: `${slotDate}T${slotTime}:00`,
      status: "held",
      heldUntil,
    };
    
    // Optionally track which user is holding the slot (if authenticated)
    if (session?.user?.id) {
      lockData.userId = session.user.id;
    }

    await getWriteClient().createIfNotExists(lockData);

    // ── 5. Update existing lock to "held" if it exists with different status ────
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { status: "held", heldUntil };
      if (session?.user?.id) {
        updateData.userId = session.user.id;
      }
      
      await getWriteClient()
        .patch(slotLockDocId)
        .set(updateData)
        .commit();
    } catch {
      // Lock might have been created by someone else (race condition)
      // Check if it's already booked
      const existingLock = await getWriteClient().fetch<{
        _id: string;
        status: string;
        heldUntil?: string;
      } | null>(
        `*[_type == "slotLock" && _id == $id][0]{_id, status, heldUntil}`,
        { id: slotLockDocId },
      );

      if (existingLock?.status === "booked") {
        return Response.json(
          { error: "Ez az időpont sajnos már foglalt. Kérjük, válasszon új időpontot." },
          { status: 409 },
        );
      }
    }

    return Response.json(
      { slotLockId: slotLockDocId, heldUntil, message: "Időpont lefoglalva." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/slot-hold] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Ismeretlen hiba történt.";
    return Response.json(
      { error: `Hiba az időpont rögzítésekor: ${message}` },
      { status: 500 },
    );
  }
}
