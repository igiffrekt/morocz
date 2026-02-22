import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

// Admin area uses a distinct, utilitarian visual style:
// dark background, no site branding, clearly "backend" — not patient-facing.
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: "#0f172a",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        minHeight: "100vh",
        color: "#f8fafc",
      }}
    >
      {children}
    </div>
  );
}
