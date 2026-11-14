"use client";

import { useEffect } from "react";
import { BookingHero } from "@/components/booking/BookingHero";
import { BookingSuccessPanel } from "@/components/booking/BookingSuccess";
import { StepIndicator } from "@/components/booking/StepIndicator";
import { formatLongDate } from "@/lib/booking-dates";
import { readConsent } from "@/lib/consent";

interface Props {
  reservationNumber: string;
  patientName: string;
  patientEmail: string;
  slotDate: string;
  slotTime: string;
  serviceName: string;
}

const STEP_LABELS = ["Időpont", "Bejelentkezés", "Megerősítés"];

export function PaymentSuccessClient({
  reservationNumber,
  patientName,
  patientEmail,
  slotDate,
  slotTime,
  serviceName,
}: Props) {
  const formattedDate = slotDate ? formatLongDate(slotDate) : "";

  // Verified paid booking → signal to GTM (Google Ads conversion fires on this event).
  // This page only renders after Stripe confirms payment, so it's the true conversion.
  // Guarded per reservation so a refresh / StrictMode re-render can't double-count.
  useEffect(() => {
    if (!reservationNumber) return;
    const key = `conv_foglalas_${reservationNumber}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    // Enhanced Conversions: hand the booking email to the Google tag BEFORE the conversion
    // fires — gtag hashes it (SHA-256) client-side and Consent Mode still gates whether it is
    // sent. Only with marketing consent. This GTM/tag version exposes no user-data toggle, so
    // the gtag layer is how EC data reaches the GTM-fired Google Ads conversion.
    if (readConsent()?.marketing && patientEmail) {
      window.gtag?.("set", "user_data", { email: patientEmail.trim().toLowerCase() });
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "foglalas_sikeres", reservation_number: reservationNumber });
  }, [reservationNumber, patientEmail]);

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <BookingHero
        crumbs={[{ label: "Időpontfoglalás" }]}
        eyebrow="Online foglalás · Kész"
        title="Időpontfoglalás"
        aside={<StepIndicator currentStep={4} steps={STEP_LABELS} />}
      />
      <BookingSuccessPanel
        paid
        serviceName={serviceName}
        date={formattedDate}
        rawDate={slotDate}
        time={slotTime}
        durationMinutes={20}
        reservationNumber={reservationNumber}
        patientName={patientName}
        patientEmail={patientEmail}
      />
    </div>
  );
}
