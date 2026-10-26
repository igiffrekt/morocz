import { getWriteClient } from "@/lib/sanity-write-client";

export function slotLockIdFor(slotDate: string, slotTime: string): string {
  return `slotLock-${slotDate}-${slotTime.replace(":", "-")}`;
}

/**
 * Frees the slotLock of a booking that is being cancelled, expired or moved
 * away — but only if no other confirmed booking still occupies that slot.
 *
 * Every public booking path trusts the slotLock alone, so unconditionally
 * setting it to "available" would reopen a slot that a second booking (e.g. an
 * admin-created one) still holds, letting a third patient book on top of it.
 *
 * Returns true if the lock was released. Throws on Sanity errors, including a
 * revision mismatch when the lock changed between the read and the write.
 */
export async function releaseSlotLock(booking: {
  _id: string;
  slotDate: string;
  slotTime: string;
}): Promise<boolean> {
  const slotLockDocId = slotLockIdFor(booking.slotDate, booking.slotTime);
  const state = await getWriteClient().fetch<{
    lock: { _rev: string; status: string } | null;
    otherBookings: number;
  } | null>(
    `{
      "lock": *[_type == "slotLock" && _id == $slotLockDocId][0]{_rev, status},
      "otherBookings": count(*[_type == "booking" && slotDate == $slotDate && slotTime == $slotTime && status == "confirmed" && _id != $bookingId])
    }`,
    {
      slotLockDocId,
      slotDate: booking.slotDate,
      slotTime: booking.slotTime,
      bookingId: booking._id,
    },
  );

  if (!state?.lock || state.lock.status !== "booked") return false;
  if (state.otherBookings > 0) {
    console.warn(
      `[slot-lock] Not releasing ${slotLockDocId}: still occupied by another confirmed booking`,
    );
    return false;
  }

  await getWriteClient()
    .patch(slotLockDocId)
    .ifRevisionId(state.lock._rev)
    .set({ status: "available" })
    .unset(["bookingRef"])
    .commit();
  return true;
}
