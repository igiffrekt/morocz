import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const addressSchema = z.object({
  postalCode: z.string().regex(/^\d{4}$/, "Az irányítószám 4 számjegyből áll"),
  city: z
    .string()
    .trim()
    .min(1, "A település megadása kötelező")
    .max(100, "A település neve túl hosszú"),
  streetAddress: z
    .string()
    .trim()
    .min(3, "Az utca és házszám megadása kötelező")
    .max(200, "A cím túl hosszú"),
});

export type AddressInput = z.infer<typeof addressSchema>;

/**
 * For use in server components on authenticated pages.
 * If the session user has no postal_code, redirects to /profil/cim?next=<currentPath>.
 * If no session, returns null (caller decides whether to require login).
 */
export async function requireAddress(currentPath: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return;

  const row = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { postalCode: true },
  });

  if (!row?.postalCode) {
    redirect(`/profil/cim?next=${encodeURIComponent(currentPath)}`);
  }
}
