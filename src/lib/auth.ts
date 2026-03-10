import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "./db";
import { isEmailConfigured, sendEmail } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  trustedOrigins: ["http://localhost:3000", "http://192.168.1.9:3000"],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,

    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      if (!isEmailConfigured()) return;
      try {
        void sendEmail({
          to: user.email,
          subject: "Jelszó visszaállítása",
          html: `<p>A jelszó visszaállításához kattintson az alábbi linkre:</p><p><a href="${url}">Jelszó visszaállítása</a></p><p>A link 1 óráig érvényes.</p>`,
        });
      } catch {
        console.error("[auth] Failed to send reset password email to", user.email);
      }
    },

    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      if (!isEmailConfigured()) return;
      try {
        void sendEmail({
          to: user.email,
          subject: "E-mail cím megerősítése",
          html: `<p>Az e-mail cím megerősítéséhez kattintson az alábbi linkre:</p><p><a href="${url}">E-mail megerősítése</a></p>`,
        });
      } catch {
        console.error("[auth] Failed to send verification email to", user.email);
      }
    },
  },

  socialProviders: {
    google: {
      // biome-ignore lint/style/noNonNullAssertion: OAuth credentials are required env vars
      clientId: process.env.GOOGLE_CLIENT_ID!,
      // biome-ignore lint/style/noNonNullAssertion: OAuth credentials are required env vars
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  accountLinking: {
    enabled: true,
    trustedProviders: ["google"],
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  rateLimit: {
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
    },
  },

  plugins: [admin(), nextCookies()],
});
