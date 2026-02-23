import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

// Admin area uses Mórocz Medical brand styling —
// professional and functional, clearly branded.
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: "#F2F4F8",
        fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif",
        minHeight: "100vh",
        color: "#1A1D2D",
      }}
    >
      {children}
    </div>
  );
}
