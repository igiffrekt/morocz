import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Új jelszó beállítása",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell crumb="Új jelszó">
      <Suspense fallback={<p className="m-0 text-center text-muted">Betöltés…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
