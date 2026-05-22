export const REFUND_WINDOW_HOURS = 48;

export interface ResolveRefundInput {
  slotDate: string; // YYYY-MM-DD
  slotTime: string; // HH:MM
  paymentStatus: string; // "paid" | "pending" | "failed"
  confirmNoRefund: boolean;
  now?: Date;
}

export interface RefundDecision {
  eligible: boolean;
  requiresConfirmation: boolean;
  reason: "ok" | "within_window" | "not_paid";
}

function hoursUntilAppointment(slotDate: string, slotTime: string, now: Date): number {
  const [h, m] = slotTime.split(":").map(Number);
  const appt = new Date(
    `${slotDate}T${String(h ?? 0).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`,
  );
  return (appt.getTime() - now.getTime()) / 3600_000;
}

export function resolveRefund(input: ResolveRefundInput): RefundDecision {
  const now = input.now ?? new Date();

  if (input.paymentStatus !== "paid") {
    return { eligible: false, requiresConfirmation: false, reason: "not_paid" };
  }

  const hours = hoursUntilAppointment(input.slotDate, input.slotTime, now);
  if (hours >= REFUND_WINDOW_HOURS) {
    return { eligible: true, requiresConfirmation: false, reason: "ok" };
  }

  return {
    eligible: false,
    requiresConfirmation: !input.confirmNoRefund,
    reason: "within_window",
  };
}
