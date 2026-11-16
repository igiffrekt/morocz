import { isFeeWaived } from "@/lib/payment-status";
import { hoursUntilBudapestSlot } from "./slot-time";

export const REFUND_WINDOW_HOURS = 48;

export interface ResolveRefundInput {
  slotDate: string; // YYYY-MM-DD
  slotTime: string; // HH:MM
  paymentStatus: string; // "paid" | "pending" | "failed" | "waived"
  confirmNoRefund: boolean;
  now?: Date;
}

export interface RefundDecision {
  eligible: boolean;
  requiresConfirmation: boolean;
  reason: "ok" | "within_window" | "not_paid" | "waived";
}

export function resolveRefund(input: ResolveRefundInput): RefundDecision {
  const now = input.now ?? new Date();

  // Fee-waived booking: nothing was paid, so there is nothing to refund or
  // credit-invoice, and no 48 h "fee is forfeited" warning to confirm.
  if (isFeeWaived(input.paymentStatus)) {
    return { eligible: false, requiresConfirmation: false, reason: "waived" };
  }

  if (input.paymentStatus !== "paid") {
    return { eligible: false, requiresConfirmation: false, reason: "not_paid" };
  }

  const hours = hoursUntilBudapestSlot(input.slotDate, input.slotTime, now);
  if (hours >= REFUND_WINDOW_HOURS) {
    return { eligible: true, requiresConfirmation: false, reason: "ok" };
  }

  return {
    eligible: false,
    requiresConfirmation: !input.confirmNoRefund,
    reason: "within_window",
  };
}
