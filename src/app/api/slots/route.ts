import { getAvailableSlotsForDate } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!date || !serviceId) {
    return Response.json(
      { error: "A 'date' és 'serviceId' paraméterek megadása kötelező." },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Érvénytelen dátumformátum. Várható formátum: YYYY-MM-DD." },
      { status: 400 },
    );
  }

  try {
    const result = await getAvailableSlotsForDate(date, serviceId);
    if (!result) {
      return Response.json({ error: "A megadott szolgáltatás nem található." }, { status: 404 });
    }
    return Response.json({
      slots: result.slots,
      date,
      serviceName: result.serviceName,
      durationMinutes: result.durationMinutes,
    });
  } catch (error) {
    console.error("[/api/slots] Error:", error);
    return Response.json({ error: "Hiba történt az időpontok lekérdezésekor." }, { status: 500 });
  }
}
