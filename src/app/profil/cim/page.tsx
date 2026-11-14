import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AddressForm } from "./AddressForm";

export const metadata: Metadata = {
  title: "Számlázási cím",
  robots: { index: false },
};

export default function AddressGatePage() {
  return (
    <AuthShell crumb="Számlázási cím">
      <Suspense fallback={<p className="m-0 text-center text-muted">Betöltés…</p>}>
        <AddressForm />
      </Suspense>
    </AuthShell>
  );
}
