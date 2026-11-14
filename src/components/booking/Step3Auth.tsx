"use client";

import AuthStep from "@/components/auth/AuthStep";
import { pillClassName } from "@/components/ui/PillButton";
import { BackArrowIcon, StepCard } from "./StepCard";

interface Step3Props {
  onSuccess: () => void;
  onBack: () => void;
}

export function Step3Auth({ onSuccess, onBack }: Step3Props) {
  return (
    <StepCard className="gap-[22px]">
      <div className="flex max-w-[620px] flex-col gap-2">
        <h2 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-navy sm:text-[28px]">
          Bejelentkezés
        </h2>
        <p className="m-0 text-[15px] leading-relaxed text-muted sm:text-base">
          Az időpontfoglalás véglegesítéséhez kérjük, jelentkezzen be vagy hozzon létre egy fiókot.
        </p>
      </div>

      {/* AuthStep handles Google OAuth and email/password, auto-advances if session exists */}
      <AuthStep onSuccess={onSuccess} className="max-w-[620px]" />

      <div className="flex pt-1.5">
        <button
          type="button"
          onClick={onBack}
          className={pillClassName({ variant: "outline", className: "h-[54px] px-6" })}
        >
          <BackArrowIcon />
          Vissza
        </button>
      </div>
    </StepCard>
  );
}
