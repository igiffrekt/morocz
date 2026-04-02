"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push("/admin");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        display: "inline-block",
        padding: "0.5rem 1.25rem",
        backgroundColor: "#ef4444",
        color: "#ffffff",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      Kijelentkezés és bejelentkezés adminként
    </button>
  );
}
