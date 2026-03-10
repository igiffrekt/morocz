"use client";

import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Get baseURL from window.location (current origin)
// This ensures localhost:3000 -> localhost:3000 and 192.168.1.9:3000 -> 192.168.1.9:3000
const baseURL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
