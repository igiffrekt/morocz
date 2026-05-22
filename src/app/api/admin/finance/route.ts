import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";
import { BOOKING_FEE_HUF } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type CompletedServiceItem = {
  serviceId: string;
  serviceName: string;
  price: number;
};

type FinanceBooking = {
  _id: string;
  patientName: string;
  service: { name: string; price: number | null } | null;
  slotDate: string;
  slotTime: string;
  status: string;
  completedServices?: CompletedServiceItem[] | null;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
};

export type ComparisonMetric = {
  current: number;
  previous: number;
  pctChange: number | null;
};

export type DailyRevenueBucket = { date: string; revenue: number; count: number };

export type ServiceBreakdownEntry = { name: string; revenue: number; count: number };

export type StatusBreakdown = {
  confirmed: { count: number; revenue: number };
  completed: { count: number; revenue: number };
  noShow: { count: number; revenue: number };
  cancelled: { count: number };
};

export type RevenueBreakdown = {
  deposits: number;
  onSite: number;
  noShowFees: number;
  pendingConfirmed: number;
};

export type TransactionEntry = {
  id: string;
  patientName: string;
  service: string;
  price: number;
  date: string;
  time: string;
  status: string;
  paymentStatus: string | null;
};

export type FinanceResponse = {
  resetDate: string | null;
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string } | null;
  revenue: ComparisonMetric;
  bookings: ComparisonMetric;
  avgTicket: ComparisonMetric;
  patients: ComparisonMetric;
  revenueBreakdown: RevenueBreakdown;
  statusBreakdown: StatusBreakdown;
  serviceBreakdown: ServiceBreakdownEntry[];
  dailyRevenue: DailyRevenueBucket[];
  transactions: TransactionEntry[];
};

// ── Date helpers ───────────────────────────────────────────────────────────────

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

// ── Revenue calculation ────────────────────────────────────────────────────────

function getBookingRevenue(b: FinanceBooking): number {
  if (b.status === "no-show") {
    return b.paymentStatus === "paid" ? (b.paymentAmount ?? BOOKING_FEE_HUF) : 0;
  }
  const deposit = b.paymentStatus === "paid" ? (b.paymentAmount ?? BOOKING_FEE_HUF) : 0;
  if (b.status === "completed" && b.completedServices?.length) {
    return Math.max(
      0,
      b.completedServices.reduce((sum, cs) => sum + (cs.price ?? 0), 0) - deposit,
    );
  }
  if (b.status === "confirmed") {
    return deposit > 0 ? deposit : (b.service?.price ?? 0);
  }
  return b.service?.price ?? 0;
}

function isRevenueStatus(status: string): boolean {
  return status === "confirmed" || status === "completed" || status === "no-show";
}

// ── GET handler ────────────────────────────────────────────────────────────────

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
    if (session.user.role !== "admin")
      return Response.json({ error: "Jogosulatlan." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const [allBookings, settings] = await Promise.all([
      getWriteClient().fetch<FinanceBooking[]>(
        `*[_type == "booking" && !(_id in path("drafts.**"))] | order(slotDate desc) {
          _id,
          patientName,
          service->{name, price},
          slotDate,
          slotTime,
          status,
          completedServices,
          paymentStatus,
          paymentAmount
        }`,
      ),
      getWriteClient().fetch<{ financeResetDate?: string | null } | null>(
        `*[_type == "siteSettings"][0]{ financeResetDate }`,
      ),
    ]);

    const resetDate = settings?.financeResetDate ?? null;
    const today = formatDateISO(new Date());

    // Effective range — defaults to "since reset" or "last 30 days"
    const defaultStart = resetDate ?? addDays(today, -29);
    let startDate = startDateParam ?? defaultStart;
    let endDate = endDateParam ?? today;

    // Reset date is a hard floor
    if (resetDate && startDate < resetDate) startDate = resetDate;
    if (endDate < startDate) endDate = startDate;

    // ── Current period ─────────────────────────────────────────────────────────
    const inRange = allBookings.filter((b) => b.slotDate >= startDate && b.slotDate <= endDate);
    const revenueBookings = inRange.filter((b) => isRevenueStatus(b.status));

    const totalRevenue = revenueBookings.reduce((s, b) => s + getBookingRevenue(b), 0);
    const bookingCount = revenueBookings.length;
    const avgTicket = bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0;
    const uniquePatients = new Set(
      inRange.map((b) => b.patientName?.toLowerCase().trim()).filter(Boolean),
    ).size;

    // ── Previous period (same length, immediately before) ──────────────────────
    const periodDays = Math.max(1, daysBetween(startDate, endDate) + 1);
    const prevEnd = addDays(startDate, -1);
    const prevStart = addDays(prevEnd, -(periodDays - 1));
    const canCompare = !resetDate || prevStart >= resetDate;

    let prevTotalRevenue = 0;
    let prevBookingCount = 0;
    let prevAvgTicket = 0;
    let prevPatients = 0;

    if (canCompare) {
      const prevInRange = allBookings.filter(
        (b) => b.slotDate >= prevStart && b.slotDate <= prevEnd,
      );
      const prevRevenueBookings = prevInRange.filter((b) => isRevenueStatus(b.status));
      prevTotalRevenue = prevRevenueBookings.reduce((s, b) => s + getBookingRevenue(b), 0);
      prevBookingCount = prevRevenueBookings.length;
      prevAvgTicket = prevBookingCount > 0 ? Math.round(prevTotalRevenue / prevBookingCount) : 0;
      prevPatients = new Set(
        prevInRange.map((b) => b.patientName?.toLowerCase().trim()).filter(Boolean),
      ).size;
    }

    // ── Revenue breakdown ──────────────────────────────────────────────────────
    let deposits = 0;
    let onSite = 0;
    let noShowFees = 0;
    let pendingConfirmed = 0;

    for (const b of revenueBookings) {
      const depositPaid =
        b.paymentStatus === "paid" ? (b.paymentAmount ?? BOOKING_FEE_HUF) : 0;
      if (b.status === "no-show") {
        noShowFees += depositPaid;
      } else if (b.status === "completed") {
        const servicesTotal =
          b.completedServices?.reduce((s, cs) => s + (cs.price ?? 0), 0) ?? 0;
        if (depositPaid > 0) {
          deposits += depositPaid;
          onSite += Math.max(0, servicesTotal - depositPaid);
        } else {
          onSite += servicesTotal;
        }
      } else if (b.status === "confirmed") {
        if (depositPaid > 0) {
          deposits += depositPaid;
        } else {
          pendingConfirmed += b.service?.price ?? 0;
        }
      }
    }

    // ── Status breakdown ───────────────────────────────────────────────────────
    const statusBreakdown: StatusBreakdown = {
      confirmed: { count: 0, revenue: 0 },
      completed: { count: 0, revenue: 0 },
      noShow: { count: 0, revenue: 0 },
      cancelled: { count: inRange.filter((b) => b.status === "cancelled").length },
    };
    for (const b of revenueBookings) {
      const rev = getBookingRevenue(b);
      if (b.status === "confirmed") {
        statusBreakdown.confirmed.count++;
        statusBreakdown.confirmed.revenue += rev;
      } else if (b.status === "completed") {
        statusBreakdown.completed.count++;
        statusBreakdown.completed.revenue += rev;
      } else if (b.status === "no-show") {
        statusBreakdown.noShow.count++;
        statusBreakdown.noShow.revenue += rev;
      }
    }

    // ── Service breakdown ──────────────────────────────────────────────────────
    const serviceMap = new Map<string, { revenue: number; count: number }>();
    for (const b of revenueBookings) {
      const name =
        b.status === "no-show" ? "Nem jelent meg" : (b.service?.name ?? "Ismeretlen");
      if (!serviceMap.has(name)) serviceMap.set(name, { revenue: 0, count: 0 });
      const s = serviceMap.get(name)!;
      s.revenue += getBookingRevenue(b);
      s.count++;
    }
    const serviceBreakdown = Array.from(serviceMap.entries())
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Daily revenue buckets ──────────────────────────────────────────────────
    const dailyMap = new Map<string, { revenue: number; count: number }>();
    for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
      dailyMap.set(d, { revenue: 0, count: 0 });
    }
    for (const b of revenueBookings) {
      const m = dailyMap.get(b.slotDate);
      if (m) {
        m.revenue += getBookingRevenue(b);
        m.count++;
      }
    }
    const dailyRevenue: DailyRevenueBucket[] = Array.from(dailyMap.entries()).map(
      ([date, val]) => ({
        date,
        revenue: val.revenue,
        count: val.count,
      }),
    );

    // ── Transactions ───────────────────────────────────────────────────────────
    const transactions: TransactionEntry[] = inRange
      .filter((b) => b.status !== "cancelled")
      .sort((a, b) => {
        const cmp = b.slotDate.localeCompare(a.slotDate);
        return cmp !== 0 ? cmp : (b.slotTime ?? "").localeCompare(a.slotTime ?? "");
      })
      .map((b) => ({
        id: b._id,
        patientName: b.patientName,
        service: b.status === "no-show" ? "Nem jelent meg" : (b.service?.name ?? "—"),
        price: getBookingRevenue(b),
        date: b.slotDate,
        time: b.slotTime ?? "",
        status: b.status,
        paymentStatus: b.paymentStatus ?? null,
      }));

    const response: FinanceResponse = {
      resetDate,
      period: { startDate, endDate },
      previousPeriod: canCompare ? { startDate: prevStart, endDate: prevEnd } : null,
      revenue: {
        current: totalRevenue,
        previous: prevTotalRevenue,
        pctChange: canCompare ? pctChange(totalRevenue, prevTotalRevenue) : null,
      },
      bookings: {
        current: bookingCount,
        previous: prevBookingCount,
        pctChange: canCompare ? pctChange(bookingCount, prevBookingCount) : null,
      },
      avgTicket: {
        current: avgTicket,
        previous: prevAvgTicket,
        pctChange: canCompare ? pctChange(avgTicket, prevAvgTicket) : null,
      },
      patients: {
        current: uniquePatients,
        previous: prevPatients,
        pctChange: canCompare ? pctChange(uniquePatients, prevPatients) : null,
      },
      revenueBreakdown: { deposits, onSite, noShowFees, pendingConfirmed },
      statusBreakdown,
      serviceBreakdown,
      dailyRevenue,
      transactions,
    };

    return Response.json(response);
  } catch (err) {
    console.error("[api/admin/finance]", err);
    return Response.json({ error: "Hiba történt." }, { status: 500 });
  }
}
