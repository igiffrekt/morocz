import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 403 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return Response.json({ error: "Email megadása kötelező." }, { status: 400 });
  }

  const row = await db.query.user.findFirst({
    where: eq(sql`lower(${user.email})`, email),
    columns: { postalCode: true, city: true, streetAddress: true },
  });

  return Response.json({
    postalCode: row?.postalCode ?? null,
    city: row?.city ?? null,
    streetAddress: row?.streetAddress ?? null,
  });
}
