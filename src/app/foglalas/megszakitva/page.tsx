"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { BookingHero } from "@/components/booking/BookingHero";
import { PillLink } from "@/components/ui/PillButton";

function CancelContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  useEffect(() => {
    if (bookingId) {
      fetch("/api/checkout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      }).catch(() => {});
    }
  }, [bookingId]);

  return (
    <div className="fade-up flex flex-col items-start gap-[18px] rounded-[32px] bg-white p-6 sm:rounded-[36px] sm:p-[clamp(24px,4vw,56px)]">
      <span className="pop-in-slow inline-flex h-[84px] w-[84px] items-center justify-center rounded-full bg-sun text-navy shadow-[0_0_0_12px_var(--color-sun-soft)]">
        <svg
          width="38"
          height="38"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </span>
      {/* biome-ignore lint/a11y/useSemanticElements: <output> cannot hold a heading; the heading itself is the status message */}
      <h2
        role="status"
        className="m-0 text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em] text-navy sm:text-[clamp(36px,4vw,48px)]"
      >
        Fizetés megszakítva
      </h2>
      <p className="m-0 max-w-[620px] text-base leading-relaxed text-muted">
        A fizetés nem történt meg. Az időpont nem került véglegesítésre. Ha szeretné, újra
        lefoglalhatja az időpontot.
      </p>
      <div className="flex w-full flex-wrap gap-3 pt-1">
        <PillLink href="/idopontfoglalas" variant="navy" arrow className="max-sm:w-full">
          Újrapróbálás
        </PillLink>
        <PillLink href="/" variant="outline" className="max-sm:w-full">
          Vissza a főoldalra
        </PillLink>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <BookingHero
        crumbs={[{ label: "Időpontfoglalás" }]}
        eyebrow="Online foglalás · Fizetés"
        title="Időpontfoglalás"
      />
      <Suspense>
        <CancelContent />
      </Suspense>
    </div>
  );
}
