import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

const CancelSchema = z.object({
  bookingId: z.string().min(1),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CancelSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { bookingId } = parsed.data;

    const booking = await getWriteClient().fetch<{
      _id: string;
      slotDate: string;
      slotTime: string;
      paymentStatus: string;
      userId: string;
    } | null>(`*[_type == "booking" && _id == $id][0]{_id, slotDate, slotTime, paymentStatus, userId}`, {
      id: bookingId,
    });

    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.paymentStatus === "paid") {
      return Response.json({ error: "Already paid" }, { status: 400 });
    }

    await getWriteClient()
      .patch(bookingId)
      .set({ status: "cancelled", paymentStatus: "failed" })
      .commit();

    const slotLockDocId = `slotLock-${booking.slotDate}-${booking.slotTime.replace(":", "-")}`;
    await getWriteClient()
      .patch(slotLockDocId)
      .set({ status: "available" })
      .unset(["bookingRef"])
      .commit()
      .catch(() => {});

    return Response.json({ success: true });
  } catch (err) {
    console.error("[api/checkout/cancel]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
