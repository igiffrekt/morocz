"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth-client";

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Force reload to admin page to show login form
    window.location.href = "/admin";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      style={{
        display: "inline-block",
        padding: "0.5rem 1.25rem",
        backgroundColor: isLoading ? "#9ca3af" : "#ef4444",
        color: "#ffffff",
        borderRadius: "9999px",
        border: "none",
        cursor: isLoading ? "not-allowed" : "pointer",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      {isLoading ? "Kijelentkezés..." : "Kijelentkezés és bejelentkezés adminként"}
    </button>
  );
}
