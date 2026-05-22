const CLINIC_TZ = "Europe/Budapest";

/**
 * Epoch-ms for a clinic-local (Europe/Budapest) wall-clock slot, independent of the
 * runtime's own timezone.
 *
 * Booking slot dates/times are stored as Budapest wall-clock values, so both the server
 * (`resolveRefund`) and the client (`CancelDialog`) must interpret them in Budapest — not
 * in whatever timezone the Node process or the browser happens to run in. Without this,
 * a server running in UTC and a Budapest browser disagree by 1–2h near the 48h refund
 * boundary, producing a wrong refund decision. Handles CET/CEST automatically via Intl.
 */
export function budapestSlotToEpochMs(slotDate: string, slotTime: string): number {
  const [y, mo, d] = slotDate.split("-").map(Number);
  const [h, mi] = slotTime.split(":").map(Number);
  // Interpret the wall-clock numbers as UTC first...
  const utcGuess = Date.UTC(y ?? 0, (mo ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, 0);
  // ...then read what wall-clock that instant shows in Budapest to recover the offset.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcGuess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const budapestAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  const offsetMs = budapestAsUtc - utcGuess;
  return utcGuess - offsetMs;
}

/** Hours from `now` until a Budapest-local slot. Negative if the slot is in the past. */
export function hoursUntilBudapestSlot(slotDate: string, slotTime: string, now: Date): number {
  return (budapestSlotToEpochMs(slotDate, slotTime) - now.getTime()) / 3_600_000;
}
