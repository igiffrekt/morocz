"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Collapse } from "@/components/ui/Accordion";
import { Notice } from "@/components/ui/Notice";
import { ArrowIcon, pillClassName } from "@/components/ui/PillButton";
import { formatLongDate } from "@/lib/booking-dates";
import { cn } from "@/lib/cn";
import type { ScheduleForAvailability } from "@/lib/slots";
import { BookingHero } from "./BookingHero";
import { BookingSuccess } from "./BookingSuccess";
import { PrenatalNoticeCard, PrenatalNoticeModal } from "./PrenatalNoticeModal";
import { ServiceSelector, serviceDisplayName } from "./ServiceSelector";
import { EmptyWell } from "./SlotGrid";
import { Step2DateTime } from "./Step2DateTime";
import { Step3Auth } from "./Step3Auth";
import { Step4Confirm } from "./Step4Confirm";
import { StepCard } from "./StepCard";
import { MobileStepProgress, StepIndicator } from "./StepIndicator";

interface ServiceItem {
  _id: string;
  name?: string;
  appointmentDuration?: number;
  icon?: unknown;
}

interface BookingSelections {
  serviceId: string | null;
  serviceName: string | null;
  serviceDuration: number | null;
  selectedDate: string | null;
  selectedTime: string | null;
  slotLockId?: string | null;
  heldUntil?: string | null;
}

interface BookingResult {
  bookingId: string;
  reservationNumber: string;
  patientName: string;
  patientEmail: string;
}

interface ScheduleData {
  schedule: ScheduleForAvailability;
  blockedDates: string[];
  bookingWindowDays: number;
}

interface BookingWizardProps {
  services: ServiceItem[];
  scheduleData: ScheduleData;
  /**
   * Preselection from the URL (?szolgaltatas=…&datum=…, homepage quick booking).
   * Takes precedence over the sessionStorage restore; the prenatal notice still has
   * to be acknowledged before Várandósgondozás is applied.
   */
  initialSelection?: { serviceId: string; date: string | null } | null;
}

/** Summary card rows (icon | label over value). */
const SUMMARY_ROW =
  "grid grid-cols-[2.5rem_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-x-3.5 gap-y-0.5 py-3";
const SUMMARY_ICON =
  "row-span-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-mint-light";
const SUMMARY_LABEL =
  "col-start-2 self-end text-xs font-bold tracking-[.06em] text-navy-soft uppercase";

const STEP_LABELS = ["Időpont", "Bejelentkezés", "Megerősítés"];
const STORAGE_KEY = "morocz-booking-wizard-v2";
const PRENATAL_NAME = "Várandósgondozás";
const BOOKING_FEE = "10 000 Ft";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -28 : 28, opacity: 0 }),
};

/** "13:20" + 20 → "13:40" */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const ICONS = {
  svc: "M22 12h-4l-3 9L9 3l-3 9H2",
  cal: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  card: "M2 5h20v14H2zM2 10h20",
};

function PathSvg({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function NumberedHeading({ id, n, children }: { id?: string; n: number; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="m-0 flex items-center gap-3 text-xl font-extrabold text-navy sm:text-[22px]"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-sage text-sm text-teal-ink"
      >
        {n}
      </span>
      {children}
    </h2>
  );
}

export function BookingWizard({ services, scheduleData, initialSelection }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const direction = useRef<number>(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const [selections, setSelections] = useState<BookingSelections>({
    serviceId: null,
    serviceName: null,
    serviceDuration: null,
    selectedDate: null,
    selectedTime: null,
    slotLockId: null,
    heldUntil: null,
  });

  // Prenatal care requires acknowledging a notice before it is selected
  const [pendingService, setPendingService] = useState<ServiceItem | null>(null);
  // Date that comes with a preselected (still pending) prenatal service
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // Conflict handling
  const [alternativeSlots, setAlternativeSlots] = useState<string[] | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Hold expiration check
  const [holdExpired, setHoldExpired] = useState(false);

  // ── Restore wizard state from sessionStorage on mount (URL preselection wins) ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount by design
  useEffect(() => {
    const preselected = initialSelection
      ? services.find((s) => s._id === initialSelection.serviceId)
      : undefined;
    if (preselected) {
      sessionStorage.removeItem(STORAGE_KEY);
      if (preselected.name === PRENATAL_NAME) {
        setPendingService(preselected);
        setPendingDate(initialSelection?.date ?? null);
      } else {
        applyService(preselected, initialSelection?.date ?? null);
      }
      // Drop the params so a reload restores the saved progress instead of re-applying them.
      window.history.replaceState(window.history.state, "", window.location.pathname);
      return;
    }

    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          currentStep?: number;
          selections?: BookingSelections;
          timestamp?: number;
        };
        if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          if (parsed.selections) {
            setSelections(parsed.selections);
          }
          if (parsed.currentStep && parsed.currentStep >= 2) {
            setCurrentStep(parsed.currentStep);
          }
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []); // Only on mount

  // ── Check if hold has expired ──────────────────────────────────────────────
  useEffect(() => {
    const heldUntil = selections.heldUntil;
    if (!heldUntil) {
      setHoldExpired(false);
      return;
    }

    // Check immediately
    const checkExpiry = () => {
      const now = Date.now();
      const expiresAt = new Date(heldUntil).getTime();
      setHoldExpired(now > expiresAt);
    };

    checkExpiry();

    // Check every 5 seconds
    const interval = setInterval(checkExpiry, 5000);

    return () => clearInterval(interval);
  }, [selections.heldUntil]);

  // ── Persist wizard state to sessionStorage on every change ────────────────
  useEffect(() => {
    // Don't persist success state
    if (bookingResult) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentStep,
        selections,
        timestamp: Date.now(),
      }),
    );
  }, [currentStep, selections, bookingResult]);

  function goToStep(next: number) {
    direction.current = next > currentStep ? 1 : -1;
    setCurrentStep(next);
    // Bring the new step into view when the patient had scrolled past its top.
    const top = mainRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollBy({ top: top - 96, behavior: reduce ? "auto" : "smooth" });
    }
  }

  function applyService(service: ServiceItem, date: string | null = null) {
    setSelections((prev) => ({
      ...prev,
      serviceId: service._id,
      serviceName: service.name ?? "",
      serviceDuration: service.appointmentDuration ?? 20,
      // slots and holds belong to the previous service
      selectedDate: date,
      selectedTime: null,
      slotLockId: null,
      heldUntil: null,
    }));
  }

  function handleServiceSelect(service: ServiceItem) {
    if (service._id === selections.serviceId) return;
    if (service.name === PRENATAL_NAME) {
      setPendingDate(null);
      setPendingService(service);
      return;
    }
    applyService(service);
  }

  function handleNoticeAcknowledge() {
    if (pendingService) applyService(pendingService, pendingDate);
    setPendingService(null);
    setPendingDate(null);
  }

  function handleDateSelect(date: string) {
    setSelections((prev) => ({
      ...prev,
      selectedDate: date,
      selectedTime: null, // reset time when date changes
    }));
  }

  function handleTimeSelect(time: string) {
    setSelections((prev) => ({ ...prev, selectedTime: time }));
  }

  function handleSlotHold(
    slotDate: string,
    slotTime: string,
    slotLockId: string,
    heldUntil: string,
  ) {
    // Store the hold info (API will check expiration on booking)
    setSelections((prev) => ({
      ...prev,
      selectedDate: slotDate,
      selectedTime: slotTime,
      slotLockId,
      heldUntil,
    }));
  }

  function handleBookingSuccess(
    bookingId: string,
    reservationNumber: string,
    patientName: string,
    patientEmail: string,
  ) {
    sessionStorage.removeItem(STORAGE_KEY);
    setBookingResult({ bookingId, reservationNumber, patientName, patientEmail });
    setCurrentStep(4); // Show success
  }

  function handleConflict(alternatives: string[]) {
    setAlternativeSlots(alternatives);
    setConflictMessage(
      "Ez az időpont sajnos már foglalt. Kérjük, válasszon egy alternatív időpontot.",
    );
  }

  function handleAlternativeSelect(time: string) {
    setSelections((prev) => ({ ...prev, selectedTime: time }));
    setAlternativeSlots(null);
    setConflictMessage(null);
    setHoldExpired(false);
  }

  function resetWizard() {
    sessionStorage.removeItem(STORAGE_KEY);
    setSelections({
      serviceId: null,
      serviceName: null,
      serviceDuration: null,
      selectedDate: null,
      selectedTime: null,
      slotLockId: null,
      heldUntil: null,
    });
    setBookingResult(null);
    setAlternativeSlots(null);
    setConflictMessage(null);
    setHoldExpired(false);
    direction.current = -1;
    setCurrentStep(1);
  }

  // Step key strings to avoid AnimatePresence key=0 bug (RESEARCH.md pitfall 6)
  function getStepKey(step: number): string {
    const keys: Record<number, string> = {
      1: "datetime",
      2: "auth",
      3: "confirm",
      4: "success",
    };
    return keys[step] ?? `step-${step}`;
  }

  const isDone = currentStep === 4 && bookingResult !== null;
  const isPrenatal = selections.serviceName === PRENATAL_NAME;
  const canContinue = selections.selectedDate !== null && selections.selectedTime !== null;
  const dateText = selections.selectedDate ? formatLongDate(selections.selectedDate) : "";
  const timeText = selections.selectedTime
    ? `${selections.selectedTime} – ${addMinutes(selections.selectedTime, selections.serviceDuration ?? 20)}`
    : "";
  const nextHint = canContinue
    ? ""
    : !selections.serviceId
      ? "Válasszon szolgáltatást."
      : selections.selectedDate
        ? "Válasszon egy szabad időpontot."
        : "Válasszon egy napot a naptárból.";
  const eyebrowStep =
    currentStep <= 3 ? `${currentStep}. lépés / 3 · ${STEP_LABELS[currentStep - 1]}` : "Kész";

  const summaryRows = [
    {
      k: "Szolgáltatás",
      v: selections.serviceName ? serviceDisplayName(selections.serviceName) : "",
      icon: ICONS.svc,
    },
    { k: "Dátum", v: dateText, icon: ICONS.cal },
    { k: "Időpont", v: timeText, icon: ICONS.clock },
  ];

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <PrenatalNoticeModal open={pendingService !== null} onAcknowledge={handleNoticeAcknowledge} />

      <BookingHero
        crumbs={[{ label: "Időpontfoglalás" }]}
        eyebrow={`Online foglalás · ${eyebrowStep}`}
        title="Időpontfoglalás"
        aside={<StepIndicator currentStep={isDone ? 4 : currentStep} steps={STEP_LABELS} />}
      />

      {!isDone && (
        <MobileStepProgress
          currentStep={currentStep}
          steps={STEP_LABELS}
          onBack={() => goToStep(Math.max(1, currentStep - 1))}
        />
      )}

      {isDone && bookingResult ? (
        <BookingSuccess
          serviceName={selections.serviceName ?? ""}
          date={selections.selectedDate ? formatLongDate(selections.selectedDate) : ""}
          rawDate={selections.selectedDate ?? ""}
          time={selections.selectedTime ?? ""}
          durationMinutes={selections.serviceDuration ?? 30}
          reservationNumber={bookingResult.reservationNumber}
          patientName={bookingResult.patientName}
          patientEmail={bookingResult.patientEmail}
          onNewBooking={resetWizard}
        />
      ) : (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(320px,1fr)] lg:items-start lg:gap-4">
          <div ref={mainRef} className="flex min-w-0 flex-col gap-3 overflow-x-clip lg:gap-4">
            {/* Show ONLY expiration banner when hold expires — hide everything else */}
            {holdExpired ? (
              <StepCard className="gap-5">
                <Notice tone="warning" title="Az időpont foglalása lejárt">
                  <span>
                    Az Ön által kiválasztott időpont foglalásának ideje (5 perc) lejárt. Kérjük,
                    válasszon új időpontot.
                  </span>
                </Notice>
                <button
                  type="button"
                  onClick={() => {
                    setHoldExpired(false);
                    setSelections((prev) => ({
                      ...prev,
                      selectedTime: null,
                      slotLockId: null,
                      heldUntil: null,
                    }));
                    goToStep(1);
                  }}
                  className={pillClassName({ variant: "navy", className: "self-start" })}
                >
                  Vissza az időpontokhoz
                  <ArrowIcon />
                </button>
              </StepCard>
            ) : (
              <>
                {/* Conflict panel */}
                {conflictMessage && alternativeSlots && (
                  <Notice tone="error" role="alert" title={conflictMessage}>
                    <span className="text-[13px] font-semibold">
                      Elérhető alternatív időpontok:
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {alternativeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleAlternativeSelect(time)}
                          className="chip-lift inline-flex h-11 items-center rounded-full border-[1.5px] border-danger/40 bg-white px-5 text-[15px] font-extrabold whitespace-nowrap text-navy tabular-nums hover:border-navy"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAlternativeSlots(null);
                        setConflictMessage(null);
                      }}
                      className="link-grow self-start py-0.5 text-[13px] font-bold text-navy"
                    >
                      Bezárás
                    </button>
                  </Notice>
                )}

                <AnimatePresence mode="wait" custom={direction.current} initial={false}>
                  <motion.div
                    key={getStepKey(currentStep)}
                    custom={direction.current}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    {renderStep(currentStep)}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Summary + prenatal notice. On phones step 1 uses the bottom sheet instead. */}
          <div
            className={cn(
              "flex min-w-0 flex-col gap-3 lg:sticky lg:top-[104px]",
              currentStep === 1 && "max-lg:hidden",
              currentStep === 3 && "max-lg:order-first",
            )}
          >
            <aside
              aria-label="Foglalás összegzése"
              className="flex flex-col gap-[18px] overflow-hidden rounded-panel bg-navy p-6 text-white sm:rounded-[36px] sm:p-7"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-extrabold tracking-[.12em] text-mint-light uppercase">
                  Összegzés
                </span>
                <span className="rounded-full bg-mint-light px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-navy">
                  {Math.min(currentStep, 3)}. lépés / 3
                </span>
              </div>
              <dl className="m-0 flex flex-col">
                {summaryRows.map((row) => (
                  // dt/dd are the row's only children (valid <dl>); the icon lives in the dt
                  // and a 2-column grid keeps it centred beside label + value.
                  <div key={row.k} className={cn(SUMMARY_ROW, "border-b border-white/10")}>
                    <dt className="contents">
                      <span aria-hidden="true" className={SUMMARY_ICON}>
                        <PathSvg d={row.icon} />
                      </span>
                      <span className={SUMMARY_LABEL}>{row.k}</span>
                    </dt>
                    <dd
                      className={cn(
                        "col-start-2 m-0 min-w-0 self-start text-base leading-snug first-letter:uppercase",
                        row.v ? "font-extrabold text-white" : "font-semibold text-navy-faint",
                      )}
                    >
                      {row.v || "Még nincs kiválasztva"}
                    </dd>
                  </div>
                ))}
                <div className={SUMMARY_ROW}>
                  <dt className="contents">
                    <span aria-hidden="true" className={SUMMARY_ICON}>
                      <PathSvg d={ICONS.card} />
                    </span>
                    <span className={SUMMARY_LABEL}>Foglalási díj</span>
                  </dt>
                  <dd className="col-start-2 m-0 self-start text-xl font-extrabold text-mint-light">
                    {BOOKING_FEE}
                  </dd>
                </div>
              </dl>
              <p className="m-0 text-[13px] leading-relaxed text-navy-soft">
                A foglalási díj a vizsgálat árába beszámít. Online bankkártyás fizetés a Stripe
                rendszerén keresztül.
              </p>
              {currentStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    disabled={!canContinue}
                    className={pillClassName({
                      variant: "pink",
                      size: "lg",
                      fullWidth: true,
                      className: "hover:bg-blush disabled:opacity-[.42]",
                    })}
                  >
                    Tovább
                    <ArrowIcon />
                  </button>
                  {nextHint && (
                    <span className="text-center text-[13px] text-navy-soft">{nextHint}</span>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="link-grow self-start border-0 bg-transparent px-0 py-1 text-sm font-bold text-mint-light"
                >
                  Időpont módosítása
                </button>
              )}
            </aside>
            <PrenatalNoticeCard open={isPrenatal} />
          </div>
        </div>
      )}

      {!isDone && !holdExpired && currentStep === 1 && (
        <MobileSummarySheet
          ready={canContinue}
          hint={nextHint}
          rows={[
            ...summaryRows.filter((r) => r.v),
            { k: "Foglalási díj", v: BOOKING_FEE, icon: ICONS.card },
          ]}
          onNext={() => goToStep(2)}
        />
      )}
    </div>
  );

  function renderStep(step: number) {
    switch (step) {
      case 1:
        return (
          <StepCard>
            <div className="flex flex-col gap-3.5">
              <NumberedHeading id="booking-service-label" n={1}>
                Válasszon szolgáltatást
              </NumberedHeading>
              <ServiceSelector
                labelledBy="booking-service-label"
                services={services}
                selectedServiceId={selections.serviceId}
                onSelect={handleServiceSelect}
              />
              <PrenatalNoticeCard open={isPrenatal} className="lg:hidden" />
            </div>
            <div className="flex flex-col gap-[18px]">
              <NumberedHeading n={2}>Válasszon időpontot</NumberedHeading>
              {selections.serviceId ? (
                <Step2DateTime
                  key={selections.serviceId}
                  selectedDate={selections.selectedDate}
                  selectedTime={selections.selectedTime}
                  serviceId={selections.serviceId ?? ""}
                  serviceDuration={selections.serviceDuration ?? 20}
                  scheduleData={scheduleData}
                  onSelectDate={handleDateSelect}
                  onSelectTime={handleTimeSelect}
                  onSlotHold={handleSlotHold}
                />
              ) : (
                <EmptyWell icon className="min-h-[200px]">
                  Először válasszon szolgáltatást.
                </EmptyWell>
              )}
            </div>
          </StepCard>
        );
      case 2:
        return (
          <Step3Auth
            onSuccess={async () => {
              try {
                const res = await fetch("/api/user/address");
                const data = (await res.json()) as { hasAddress?: boolean };
                if (!data.hasAddress) {
                  window.location.href = "/profil/cim?next=/idopontfoglalas";
                  return;
                }
              } catch {
                // network error — let them through, checkout will catch address issues
              }
              goToStep(3);
            }}
            onBack={() => goToStep(1)}
          />
        );
      case 3:
        return (
          <Step4Confirm
            selections={{
              serviceId: selections.serviceId ?? "",
              serviceName: selections.serviceName ?? "",
              serviceDuration: selections.serviceDuration ?? 20,
              selectedDate: selections.selectedDate ?? "",
              selectedTime: selections.selectedTime ?? "",
            }}
            onBack={() => goToStep(2)}
            onSuccess={handleBookingSuccess}
            onConflict={handleConflict}
          />
        );
      default:
        return null;
    }
  }
}

interface MobileSummarySheetProps {
  ready: boolean;
  hint: string;
  rows: Array<{ k: string; v: string }>;
  onNext: () => void;
}

/**
 * Phone bottom sheet of step 1 (MobilFoglalas): the summary rows slide open once a slot
 * is chosen; "Tovább" stays greyed out until then. Flags <body> so the footer gets
 * bottom padding and the sheet never hides the legal links.
 */
function MobileSummarySheet({ ready, hint, rows, onNext }: MobileSummarySheetProps) {
  useEffect(() => {
    document.body.setAttribute("data-booking-sheet", "");
    return () => document.body.removeAttribute("data-booking-sheet");
  }, []);

  return (
    <section
      aria-label="Foglalás összegzése"
      className="fixed inset-x-0 bottom-0 z-30 rounded-t-[30px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_44px_-22px_rgba(36,42,95,.55)] lg:hidden"
    >
      <div className="flex justify-center pt-2 pb-0.5">
        <span aria-hidden="true" className="h-[5px] w-10 rounded-full bg-line" />
      </div>
      <Collapse open={ready}>
        <div className="flex flex-col gap-2 px-5 pt-1.5 pb-1">
          <span className="text-xs font-extrabold tracking-[.12em] text-teal-ink uppercase">
            Összegzés
          </span>
          {rows.map((row) => (
            <div key={row.k} className="flex justify-between gap-3 py-0.5 text-sm">
              <span className="shrink-0 text-muted">{row.k}</span>
              <strong className="text-right text-navy first-letter:uppercase">{row.v}</strong>
            </div>
          ))}
        </div>
      </Collapse>
      <div className="flex items-center gap-2.5 px-3 pt-2 pb-3.5">
        <span className="min-w-0 flex-1 pl-2 text-[13px] font-bold text-muted">
          {ready ? "Minden kész a folytatáshoz." : hint}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!ready}
          className={cn(
            "tap-press inline-flex h-[54px] shrink-0 items-center gap-2.5 rounded-full px-6 text-base font-extrabold whitespace-nowrap",
            ready
              ? "bg-navy text-white shadow-[0_14px_28px_-14px_rgba(36,42,95,.8)]"
              : "bg-[#e3e7ef] text-[#8b91a8]",
          )}
        >
          Tovább
          <ArrowIcon />
        </button>
      </div>
    </section>
  );
}
