import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

type CompletedService = {
  serviceId: string;
  serviceName: string;
  price: number;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 403 });
    }

    const body = (await request.json()) as {
      bookingId?: string;
      completedServices?: CompletedService[];
    };

    if (!body.bookingId || !body.completedServices?.length) {
      return Response.json(
        { error: "Foglalás ID és legalább egy szolgáltatás szükséges." },
        { status: 400 },
      );
    }

    const client = getWriteClient();

    const existing = await client.fetch<{ completedAt: string | null } | null>(
      `*[_type == "booking" && _id == $id][0]{ completedAt }`,
      { id: body.bookingId },
    );

    await client
      .patch(body.bookingId)
      .set({
        status: "completed",
        completedServices: body.completedServices.map((s) => ({
          _key: s.serviceId,
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          price: s.price,
        })),
        completedAt: existing?.completedAt ?? new Date().toISOString(),
      })
      .commit();

    return Response.json({ success: true });
  } catch (err) {
    console.error("[api/admin/booking-complete]", err);
    return Response.json({ error: "Hiba történt a teljesítés rögzítésekor." }, { status: 500 });
  }
}
