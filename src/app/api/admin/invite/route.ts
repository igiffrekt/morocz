import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const InviteBodySchema = z.object({
  email: z.string().email("Érvénytelen e-mail cím formátum."),
  name: z.string().min(1, "A név megadása kötelező."),
});

export async function POST(request: Request): Promise<Response> {
  // ── 1. Verify caller is admin ───────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Nem hitelesített kérés." }, { status: 403 });
  }

  if (session.user.role !== "admin") {
    return Response.json(
      { error: "Hozzáférés megtagadva. Csak adminisztrátorok hívhatják ezt a végpontot." },
      { status: 403 },
    );
  }

  // ── 2. Parse and validate request body ─────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés törzs." }, { status: 400 });
  }

  const parsed = InviteBodySchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
    return Response.json({ error: firstError }, { status: 400 });
  }

  const { email, name } = parsed.data;

  // ── 3. Generate temporary password ────────────────────────────────────────
  // 12-character random string from a UUID — sufficient for a temp password
  // that must be changed after first login.
  const tempPassword = crypto.randomUUID().slice(0, 12);

  // ── 4. Create the new admin user ───────────────────────────────────────────
  try {
    await auth.api.createUser({
      body: {
        email,
        password: tempPassword,
        name,
        role: "admin",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (
      message.includes("already") ||
      message.includes("exists") ||
      message.includes("duplicate")
    ) {
      return Response.json({ error: "Ez az e-mail cím már regisztrálva van." }, { status: 409 });
    }

    console.error("[admin/invite] Failed to create user:", error);
    return Response.json(
      { error: "Hiba történt a felhasználó létrehozásakor. Kérjük, próbálja újra." },
      { status: 500 },
    );
  }

  // ── 5. Send invite email via Gmail API (fire-and-forget) ───────────────────
  void sendEmail({
    to: email,
    subject: "Meghívó — Morocz Medical Admin",
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
        <h1 style="margin: 0 0 24px; font-size: 20px; font-weight: 700; color: #f8fafc;">
          Meghívó — Morocz Medical Admin
        </h1>

        <p style="margin: 0 0 16px; font-size: 15px; color: #cbd5e1;">
          Kedves ${name},
        </p>

        <p style="margin: 0 0 24px; font-size: 15px; color: #cbd5e1;">
          Meghívást kapott a Morocz Medical adminisztrátori felületére.
        </p>

        <div style="background: #1e293b; border-radius: 6px; padding: 20px; margin: 0 0 24px;">
          <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
            Bejelentkezési adatai
          </p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #f8fafc;">
            <strong>E-mail:</strong> ${email}
          </p>
          <p style="margin: 0; font-size: 14px; color: #f8fafc;">
            <strong>Ideiglenes jelszó:</strong> <code style="font-family: monospace; background: #334155; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code>
          </p>
        </div>

        <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8;">
          Kérjük, a bejelentkezés után változtassa meg a jelszavát.
        </p>

        <a
          href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://drmoroczangela.hu"}/admin"
          style="display: inline-block; padding: 10px 20px; background: #334155; color: #f8fafc; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;"
        >
          Belépés az admin felületre
        </a>
      </div>
    `,
  });

  // ── 6. Return 201 — do NOT include temp password in response ───────────────
  return Response.json({ success: true, email }, { status: 201 });
}
