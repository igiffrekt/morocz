"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/admin";
          },
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout by clearing cookies and redirecting
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = "/admin";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        display: "inline-block",
        padding: "0.5rem 1.25rem",
        backgroundColor: loading ? "#9ca3af" : "#ef4444",
        color: "#ffffff",
        borderRadius: "9999px",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      {loading ? "Kijelentkezés..." : "Kijelentkezés és bejelentkezés adminként"}
    </button>
  );
}
