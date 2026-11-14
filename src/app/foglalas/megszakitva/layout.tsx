import type { Metadata } from "next";

// page.tsx is a client component, so its <title> lives here.
export const metadata: Metadata = {
  title: "Fizetés megszakítva",
  robots: { index: false },
};

export default function CancelledLayout({ children }: { children: React.ReactNode }) {
  return children;
}
