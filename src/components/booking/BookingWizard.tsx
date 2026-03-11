"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ScheduleForAvailability } from "@/lib/slots";
import { BookingSuccess } from "./BookingSuccess";
import { Step1Service } from "./Step1Service";
import { Step2DateTime } from "./Step2DateTime";
import { Step3Auth } from "./Step3Auth";
import { Step4Confirm } from "./Step4Confirm";
import { StepIndicator } from "./StepIndicator";

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
}

interface BookingWizardProps {
  services: ServiceItem[];
  scheduleData: ScheduleData;
}

const STEP_LABELS = ["Szolgáltatás", "Időpont", "Bejelentkezés", "Megerősítés"];
const STORAGE_KEY = "morocz-booking-wizard";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

function formatDateHungarian(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function BookingWizard({ services, scheduleData }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const direction = useRef<number>(0);

  const [selections, setSelections] = useState<BookingSelections>({
    serviceId: null,
    serviceName: null,
    serviceDuration: null,
    selectedDate: null,
    selectedTime: null,
    slotLockId: null,
    heldUntil: null,
  });

  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // Conflict handling
  const [alternativeSlots, setAlternativeSlots] = useState<string[] | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Hold expiration check
  const [holdExpired, setHoldExpired] = useState(false);



  // ── Restore wizard state from sessionStorage on mount ──────────────────────
  useEffect(() => {
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
          if (parsed.currentStep && parsed.currentStep >= 3) {
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
    if (!selections.heldUntil) {
      setHoldExpired(false);
      return;
    }

    // Check immediately
    const checkExpiry = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(selections.heldUntil).getTime();
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
  }

  function handleServiceSelect(id: string, name: string, duration: number) {
    setSelections((prev) => ({
      ...prev,
      serviceId: id,
      serviceName: name,
      serviceDuration: duration,
    }));
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

  function handleSlotHold(slotDate: string, slotTime: string, slotLockId: string, heldUntil: string) {
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
    setCurrentStep(5); // Show success
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
      1: "service",
      2: "datetime",
      3: "auth",
      4: "confirm",
      5: "success",
    };
    return keys[step] ?? `step-${step}`;
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (currentStep === 5 && bookingResult) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        <BookingSuccess
          serviceName={selections.serviceName ?? ""}
          date={selections.selectedDate ? formatDateHungarian(selections.selectedDate) : ""}
          rawDate={selections.selectedDate ?? ""}
          time={selections.selectedTime ?? ""}
          durationMinutes={selections.serviceDuration ?? 30}
          reservationNumber={bookingResult.reservationNumber}
          patientName={bookingResult.patientName}
          patientEmail={bookingResult.patientEmail}
          onNewBooking={resetWizard}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
      <StepIndicator currentStep={currentStep} steps={STEP_LABELS} />

      {/* Show ONLY expiration banner when hold expires — hide everything else */}
      {holdExpired ? (
        <div className="mt-6 px-4 py-6 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <svg
              className="w-6 h-6 text-amber-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-900">Az időpont foglalása lejárt</h3>
              <p className="text-sm text-amber-700 mt-1">
                Az Ön által kiválasztott időpont foglalásának ideje (5 perc) lejárt. Kérjük, válasszon új időpontot.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setHoldExpired(false);
              setSelections((prev) => ({ ...prev, selectedTime: null, slotLockId: null, heldUntil: null }));
              goToStep(2);
            }}
            className="w-full px-4 py-2.5 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Vissza az időpontokhoz
          </button>
        </div>
      ) : (
        <>
          {/* Conflict panel */}
      {conflictMessage && alternativeSlots && (
        <div className="mb-4 px-4 py-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700 font-medium mb-3">{conflictMessage}</p>
          <p className="text-xs text-gray-600 mb-2">Elérhető alternatív időpontok:</p>
          <div className="flex flex-wrap gap-2">
            {alternativeSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => handleAlternativeSelect(time)}
                className="px-4 py-2 text-sm font-semibold bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-700 hover:text-white transition-colors"
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
            className="mt-3 text-xs text-gray-500 underline hover:no-underline"
          >
            Bezárás
          </button>
        </div>
      )}



      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction.current}>
          <motion.div
            key={getStepKey(currentStep)}
            custom={direction.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {renderStep(currentStep)}
          </motion.div>
        </AnimatePresence>
      </div>
        </>
      )}
    </div>
  );

  function renderStep(step: number) {
    switch (step) {
      case 1:
        return (
          <Step1Service
            services={services}
            selectedServiceId={selections.serviceId}
            onSelect={handleServiceSelect}
            onNext={() => goToStep(2)}
          />
        );
      case 2:
        return (
          <Step2DateTime
            selectedDate={selections.selectedDate}
            selectedTime={selections.selectedTime}
            serviceId={selections.serviceId ?? ""}
            serviceDuration={selections.serviceDuration ?? 20}
            scheduleData={scheduleData}
            onSelectDate={handleDateSelect}
            onSelectTime={handleTimeSelect}
            onSlotHold={handleSlotHold}
            onNext={() => goToStep(3)}
            onBack={() => goToStep(1)}
          />
        );
      case 3:
        return <Step3Auth onSuccess={() => goToStep(4)} onBack={() => goToStep(2)} />;
      case 4:
        return (
          <Step4Confirm
            selections={{
              serviceId: selections.serviceId ?? "",
              serviceName: selections.serviceName ?? "",
              serviceDuration: selections.serviceDuration ?? 20,
              selectedDate: selections.selectedDate ?? "",
              selectedTime: selections.selectedTime ?? "",
            }}
            onBack={() => goToStep(3)}
            onSuccess={handleBookingSuccess}
            onConflict={handleConflict}
          />
        );
      default:
        return null;
    }
  }
}
