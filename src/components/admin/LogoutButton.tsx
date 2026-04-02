"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      // Call better-auth sign-out endpoint
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear all cookies as backup
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0]?.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      }
    });

    // Force reload to admin page
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
