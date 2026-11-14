import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ClaimCompleteForm } from "./ClaimCompleteForm";

export const metadata: Metadata = {
  title: "Fiók aktiválása",
  robots: { index: false },
};

export default function ClaimCompletePage() {
  return (
    <AuthShell crumb="Fiók aktiválása">
      <Suspense fallback={<p className="m-0 text-center text-muted">Betöltés…</p>}>
        <ClaimCompleteForm />
      </Suspense>
    </AuthShell>
  );
}
