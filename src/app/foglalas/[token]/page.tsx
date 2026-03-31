import type { Metadata } from "next";
import { BookingManagementCard } from "@/components/management/BookingManagementCard";
import { getWriteClient } from "@/lib/sanity-write-client";
import { sanityFetch } from "@/sanity/lib/fetch";
import { blockedDatesQuery, weeklyScheduleQuery } from "@/sanity/lib/queries";
import type { BlockedDate, WeeklySchedule } from "../../../../sanity.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Időpont kezelése — Mórocz Medical",
  robots: { index: false },
};

export default async function FoglalasTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  type BookingResult = {
    _id: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    reservationNumber: string;
    service: { name: string; appointmentDuration: number } | null;
    serviceId: string;
    slotDate: string;
    slotTime: string;
    status: string;
    managementToken: string;
  };

  // Fetch booking by managementToken using write client (always fresh, never cached)
  // Note: $token is a reserved QueryParams key in @sanity/client — use $manageToken instead
  const booking = await getWriteClient().fetch<BookingResult | null>(
    `*[_type == "booking" && managementToken == $manageToken][0]{
      _id, patientName, patientEmail, patientPhone, reservationNumber,
      service->{name, appointmentDuration},
      "serviceId": service._ref,
      slotDate, slotTime, status, managementToken
    }`,
    { manageToken: token },
  );

  // Fetch schedule data for the reschedule picker (Plan 03 will use this)
  const [weeklySchedule, blockedDatesDoc] = await Promise.all([
    sanityFetch<WeeklySchedule | null>({ query: weeklyScheduleQuery, tags: ["weeklySchedule"] }),
    sanityFetch<BlockedDate | null>({ query: blockedDatesQuery, tags: ["blockedDate"] }),
  ]);

  const normalizedDays = (weeklySchedule?.days ?? []).map((d) => ({
    dayOfWeek: d.dayOfWeek ?? 0,
    isDayOff: d.isDayOff ?? false,
    startTime: d.startTime ?? "",
    endTime: d.endTime ?? "",
  }));

  const scheduleData = {
    schedule: {
      defaultSlotDuration: weeklySchedule?.defaultSlotDuration ?? 20,
      bufferMinutes: weeklySchedule?.bufferMinutes ?? 0,
      days: normalizedDays,
    },
    blockedDates: (blockedDatesDoc?.dates ?? []).map((d) => d.date ?? "").filter(Boolean),
  };

  // Determine appointment state
  const today = new Date().toISOString().slice(0, 10);

  function isPastAppointment(slotDate: string, slotTime: string): boolean {
    if (slotDate < today) return true;
    if (slotDate === today) {
      const [h, m] = slotTime.split(":").map(Number);
      const appt = new Date(
        `${slotDate}T${String(h ?? 0).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`,
      );
      return appt.getTime() < Date.now();
    }
    return false;
  }

  // Shared layout wrapper
  function PageWrapper({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5] px-4 py-12">
        <div className="w-full max-w-2xl">
          <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-[#23264F]">
            Mórocz Medical
          </p>
          {children}
        </div>
      </div>
    );
  }

  // ── State 1: No booking found ──────────────────────────────────────────────
  if (!booking) {
    return (
      <PageWrapper>
        <div className="rounded-xl bg-white p-8 shadow-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-3 text-xl font-bold text-[#23264F]">
            Érvénytelen vagy lejárt hivatkozás
          </h1>
          <p className="mb-6 text-gray-600">
            Ez a hivatkozás nem érvényes vagy már nem használható. Ha új időpontot szeretne
            foglalni, kattintson az alábbi gombra.
          </p>
          <a
            href="/idopontfoglalas"
            className="inline-block rounded-lg bg-[#23264F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1a1d3b]"
          >
            Új időpont foglalása
          </a>
        </div>
      </PageWrapper>
    );
  }

  // ── State 2: Cancelled booking ─────────────────────────────────────────────
  if (booking.status === "cancelled") {
    const formattedDate = new Date(booking.slotDate).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    return (
      <PageWrapper>
        <div className="rounded-xl bg-white p-8 shadow-md">
          <h1 className="mb-3 text-xl font-bold text-[#23264F]">
            Ez az időpont már le lett mondva
          </h1>
          <p className="mb-6 text-gray-600">
            Az alábbi időpontja korábban lemondásra került. Ha új időpontot szeretne foglalni,
            kattintson a gombra.
          </p>
          <div className="mb-6 rounded-lg border-l-4 border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="mb-1 font-medium text-gray-500">Szolgáltatás</p>
            <p className="mb-3 font-semibold text-gray-400 line-through">
              {booking.service?.name ?? "Foglalt szolgáltatás"}
            </p>
            <p className="mb-1 font-medium text-gray-500">Időpont</p>
            <p className="font-semibold text-gray-400 line-through">
              {formattedDate}, {booking.slotTime}
            </p>
          </div>
          <a
            href="/idopontfoglalas"
            className="inline-block rounded-lg bg-[#76c8b6] px-6 py-3 text-sm font-semibold text-[#23264F] transition hover:bg-[#80bea6]"
          >
            Új időpont foglalása
          </a>
        </div>
      </PageWrapper>
    );
  }

  // ── State 3: Past appointment ──────────────────────────────────────────────
  if (isPastAppointment(booking.slotDate, booking.slotTime)) {
    const formattedDate = new Date(booking.slotDate).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    return (
      <PageWrapper>
        <div className="rounded-xl bg-white p-8 shadow-md">
          <h1 className="mb-3 text-xl font-bold text-[#23264F]">Ez az időpont már lezajlott</h1>
          <p className="mb-6 text-gray-600">
            A foglalt időpontja már elmúlt. Ha új időpontot szeretne foglalni, kattintson az alábbi
            gombra.
          </p>
          <div className="mb-6 rounded-lg border-l-4 border-[#76c8b6] bg-gray-50 p-4 text-sm">
            <p className="mb-1 font-medium text-gray-500">Szolgáltatás</p>
            <p className="mb-3 font-semibold text-[#23264F]">
              {booking.service?.name ?? "Foglalt szolgáltatás"}
            </p>
            <p className="mb-1 font-medium text-gray-500">Időpont</p>
            <p className="font-semibold text-[#23264F]">
              {formattedDate}, {booking.slotTime}
            </p>
          </div>
          <a
            href="/idopontfoglalas"
            className="inline-block rounded-lg bg-[#23264F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1a1d3b]"
          >
            Új időpont foglalása
          </a>
        </div>
      </PageWrapper>
    );
  }

  // ── State 4: Active booking ────────────────────────────────────────────────
  return (
    <PageWrapper>
      <BookingManagementCard booking={booking} scheduleData={scheduleData} />
    </PageWrapper>
  );
}
