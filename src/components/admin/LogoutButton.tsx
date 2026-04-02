"use client";

export default function LogoutButton() {
  function handleLogout() {
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0]?.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      }
    });
    // Redirect to admin page (will show login form after cookies cleared)
    window.location.href = "/admin";
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
