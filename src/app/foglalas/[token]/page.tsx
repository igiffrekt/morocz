import type { Metadata } from "next";
import { BookingHero } from "@/components/booking/BookingHero";
import { BookingManagementCard } from "@/components/management/BookingManagementCard";
import { ManageRulesAside } from "@/components/management/ManageRulesAside";
import { PillLink } from "@/components/ui/PillButton";
import { formatLongDate } from "@/lib/booking-dates";
import { getWriteClient } from "@/lib/sanity-write-client";
import { sanityFetch } from "@/sanity/lib/fetch";
import { blockedDatesQuery, weeklyScheduleQuery } from "@/sanity/lib/queries";
import type { BlockedDate, WeeklySchedule } from "../../../../sanity.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Időpont kezelése",
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
    paymentStatus: string | null;
  };

  // Fetch booking by managementToken using write client (always fresh, never cached)
  // Note: $token is a reserved QueryParams key in @sanity/client — use $manageToken instead
  const booking = await getWriteClient().fetch<BookingResult | null>(
    `*[_type == "booking" && managementToken == $manageToken][0]{
      _id, patientName, patientEmail, patientPhone, reservationNumber,
      service->{name, appointmentDuration},
      "serviceId": service._ref,
      slotDate, slotTime, status, managementToken, paymentStatus
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
    bookingWindowDays: weeklySchedule?.bookingWindowDays ?? 30,
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

  // Shared layout: navy hero, the state card on the left, the "Jó tudni" rules on the right.
  function PageWrapper({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex flex-col gap-3 lg:gap-4">
        <BookingHero
          crumbs={[{ label: "Foglalás kezelése" }]}
          eyebrow="Foglalás kezelése"
          title="Időpont módosítása vagy lemondása"
          lead="A lefoglalt időpont díjmentesen áthelyezhető egy másik szabad időpontra, legkésőbb a foglalt időpontot megelőző 24 óráig."
          disc="bottom-left"
        />
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(340px,1fr)] lg:items-start lg:gap-4">
          <div className="min-w-0">{children}</div>
          <ManageRulesAside />
        </div>
      </div>
    );
  }

  /** Card for the inactive states (invalid link / cancelled / past). */
  function StateCard({
    icon,
    iconClassName,
    title,
    text,
    appointment,
    struck = false,
  }: {
    icon: string;
    iconClassName: string;
    title: string;
    text: string;
    appointment?: { service: string; when: string };
    struck?: boolean;
  }) {
    return (
      <div className="fade-up flex flex-col items-start gap-[18px] rounded-panel bg-white p-6 sm:rounded-[36px] sm:p-[clamp(24px,4vw,48px)]">
        <span
          className={`inline-flex h-[76px] w-[76px] items-center justify-center rounded-full ${iconClassName}`}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={icon} />
          </svg>
        </span>
        <h2 className="m-0 text-[28px] font-extrabold tracking-[-0.02em] text-navy sm:text-[34px]">
          {title}
        </h2>
        <p className="m-0 max-w-[560px] text-base leading-relaxed text-muted">{text}</p>
        {appointment && (
          <dl
            className={`m-0 flex max-w-full flex-wrap gap-x-7 gap-y-2 rounded-tile bg-canvas px-[22px] py-3.5 text-[15px] ${struck ? "text-muted line-through" : "text-navy"}`}
          >
            <div className="flex gap-1.5">
              <dt className="font-semibold text-muted">Szolgáltatás:</dt>
              <dd className="m-0 font-extrabold">{appointment.service}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-semibold text-muted">Időpont:</dt>
              <dd className="m-0 font-extrabold">{appointment.when}</dd>
            </div>
          </dl>
        )}
        <div className="flex w-full flex-wrap gap-3">
          <PillLink
            href="/idopontfoglalas"
            variant="mint"
            arrow
            className="bg-mint hover:bg-mint max-sm:w-full"
          >
            Új időpont foglalása
          </PillLink>
          <PillLink href="/" variant="outline" className="max-sm:w-full">
            Vissza a főoldalra
          </PillLink>
        </div>
      </div>
    );
  }

  // ── State 1: No booking found ──────────────────────────────────────────────
  if (!booking) {
    return (
      <PageWrapper>
        <StateCard
          icon="M12 9v4m0 4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
          iconClassName="bg-sun-soft text-navy"
          title="Érvénytelen vagy lejárt hivatkozás"
          text="Ez a hivatkozás nem érvényes vagy már nem használható. Ha új időpontot szeretne foglalni, kattintson az alábbi gombra."
        />
      </PageWrapper>
    );
  }

  const appointment = {
    service: booking.service?.name ?? "Foglalt szolgáltatás",
    when: `${formatLongDate(booking.slotDate)}, ${booking.slotTime}`,
  };

  // ── State 2: Cancelled booking ─────────────────────────────────────────────
  if (booking.status === "cancelled") {
    return (
      <PageWrapper>
        <StateCard
          icon="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6"
          iconClassName="bg-coral-soft text-danger"
          title="Ez az időpont már le lett mondva"
          text="Az alábbi időpontja korábban lemondásra került. Ha új időpontot szeretne foglalni, kattintson a gombra."
          appointment={appointment}
          struck
        />
      </PageWrapper>
    );
  }

  // ── State 3: Past appointment ──────────────────────────────────────────────
  if (isPastAppointment(booking.slotDate, booking.slotTime)) {
    return (
      <PageWrapper>
        <StateCard
          icon="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2"
          iconClassName="bg-sage text-teal-ink"
          title="Ez az időpont már lezajlott"
          text="A foglalt időpontja már elmúlt. Ha új időpontot szeretne foglalni, kattintson az alábbi gombra."
          appointment={appointment}
        />
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
