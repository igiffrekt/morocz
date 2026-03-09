import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

type FinanceBooking = {
  _id: string;
  patientName: string;
  service: { name: string; price: number | null; appointmentDuration: number } | null;
  slotDate: string;
  status: string;
};

export type MonthlyRevenue = {
  month: string;  // "2026-01"
  label: string;  // "Jan 2026"
  revenue: number;
  count: number;
};

export type ServiceRevenue = {
  service: string;
  revenue: number;
  count: number;
};

export type RecentTransaction = {
  id: string;
  patientName: string;
  service: string;
  price: number;
  date: string;
};

export type FinanceResponse = {
  totalRevenue: number;
  currentMonthRevenue: number;
  avgRevenue: number;
  totalConfirmed: number;
  totalCancelled: number;
  uniquePatients: number;
  monthlyRevenue: MonthlyRevenue[];
  serviceRevenue: ServiceRevenue[];
  recentTransactions: RecentTransaction[];
};

const HU_MONTHS = ["Jan", "Feb", "Már", "Ápr", "Máj", "Jún", "Júl", "Aug", "Szep", "Okt", "Nov", "Dec"];

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
    if (session.user.role !== "admin") return Response.json({ error: "Jogosulatlan." }, { status: 403 });

    const bookings = await getWriteClient().fetch<FinanceBooking[]>(
      `*[_type == "booking" && !(_id in path("drafts.**"))] | order(slotDate desc) {
        _id,
        patientName,
        service->{name, price, appointmentDuration},
        slotDate,
        status
      }`,
    );

    const confirmed = bookings.filter((b) => b.status === "confirmed");

    // ── Totals ──────────────────────────────────────────────────────────────────
    const totalRevenue = confirmed.reduce((s, b) => s + (b.service?.price ?? 0), 0);
    const avgRevenue = confirmed.length > 0 ? Math.round(totalRevenue / confirmed.length) : 0;

    // Current month
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentMonthRevenue = confirmed
      .filter((b) => b.slotDate.startsWith(currentMonthKey))
      .reduce((s, b) => s + (b.service?.price ?? 0), 0);

    // Unique patients
    const uniquePatients = new Set(bookings.map((b) => b.patientName?.toLowerCase().trim())).size;

    // ── Monthly revenue (last 12 months) ────────────────────────────────────────
    const monthlyMap = new Map<string, { revenue: number; count: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, { revenue: 0, count: 0 });
    }

    for (const b of confirmed) {
      const key = b.slotDate.substring(0, 7);
      if (monthlyMap.has(key)) {
        const m = monthlyMap.get(key)!;
        m.revenue += b.service?.price ?? 0;
        m.count++;
      }
    }

    const monthlyRevenue: MonthlyRevenue[] = Array.from(monthlyMap.entries()).map(([key, val]) => {
      const [year, month] = key.split("-");
      const mIdx = Number.parseInt(month) - 1;
      return {
        month: key,
        label: `${HU_MONTHS[mIdx]} ${year}`,
        shortLabel: HU_MONTHS[mIdx],
        revenue: val.revenue,
        count: val.count,
      };
    });

    // ── Revenue by service ───────────────────────────────────────────────────────
    const serviceMap = new Map<string, { revenue: number; count: number }>();
    for (const b of confirmed) {
      const name = b.service?.name ?? "Ismeretlen";
      if (!serviceMap.has(name)) serviceMap.set(name, { revenue: 0, count: 0 });
      const s = serviceMap.get(name)!;
      s.revenue += b.service?.price ?? 0;
      s.count++;
    }

    const serviceRevenue: ServiceRevenue[] = Array.from(serviceMap.entries())
      .map(([service, val]) => ({ service, ...val }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // ── Recent transactions (last 15 confirmed) ──────────────────────────────────
    const recentTransactions: RecentTransaction[] = confirmed.slice(0, 15).map((b) => ({
      id: b._id,
      patientName: b.patientName,
      service: b.service?.name ?? "—",
      price: b.service?.price ?? 0,
      date: b.slotDate,
    }));

    const response: FinanceResponse = {
      totalRevenue,
      currentMonthRevenue,
      avgRevenue,
      totalConfirmed: confirmed.length,
      totalCancelled: bookings.filter((b) => b.status === "cancelled").length,
      uniquePatients,
      monthlyRevenue,
      serviceRevenue,
      recentTransactions,
    };

    return Response.json(response);
  } catch (err) {
    console.error("[api/admin/finance]", err);
    return Response.json({ error: "Hiba történt." }, { status: 500 });
  }
}
