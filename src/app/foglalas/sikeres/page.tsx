import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { PaymentSuccessClient } from "./PaymentSuccessClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sikeres foglalás",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/idopontfoglalas");
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    redirect("/idopontfoglalas");
  }

  if (session.payment_status !== "paid") {
    redirect("/idopontfoglalas");
  }

  const meta = session.metadata ?? {};

  return (
    <PaymentSuccessClient
      reservationNumber={meta.reservationNumber ?? ""}
      patientName={meta.patientName ?? ""}
      patientEmail={meta.patientEmail ?? ""}
      slotDate={meta.slotDate ?? ""}
      slotTime={meta.slotTime ?? ""}
      serviceName={meta.serviceName ?? "Időpontfoglalás"}
    />
  );
}
