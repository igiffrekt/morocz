import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 403 });
    }

    const client = getWriteClient();

    const today = new Date();
    const resetDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const settingsDoc = await client.fetch<{ _id: string } | null>(
      `*[_type == "siteSettings"][0]{ _id }`,
    );

    if (!settingsDoc) {
      return Response.json({ error: "Beállítások dokumentum nem található." }, { status: 404 });
    }

    await client.patch(settingsDoc._id).set({ financeResetDate: resetDate }).commit();

    return Response.json({ success: true, resetDate });
  } catch (err) {
    console.error("[api/admin/finance/reset]", err);
    return Response.json({ error: "Hiba történt a visszaállítás során." }, { status: 500 });
  }
}
