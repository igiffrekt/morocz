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
}

interface BookingResult {
  bookingId: string;
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
const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

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
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selections, setSelections] = useState<BookingSelections>({
    serviceId: null,
    serviceName: null,
    serviceDuration: null,
    selectedDate: null,
    selectedTime: null,
  });

  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // Conflict handling
  const [alternativeSlots, setAlternativeSlots] = useState<string[] | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Hold timer expiry
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

  // ── 5-minute hold timer starting from step 3 ──────────────────────────────
  useEffect(() => {
    if (currentStep >= 3 && currentStep <= 4 && selections.selectedTime) {
      setHoldExpired(false);
      holdTimerRef.current = setTimeout(() => {
        setHoldExpired(true);
      }, HOLD_DURATION_MS);
      return () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      };
    }
    return undefined;
  }, [currentStep, selections.selectedTime]);

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

  function handleBookingSuccess(bookingId: string, patientName: string, patientEmail: string) {
    sessionStorage.removeItem(STORAGE_KEY);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setBookingResult({ bookingId, patientName, patientEmail });
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
    // Reset hold timer
    setHoldExpired(false);
  }

  function resetWizard() {
    sessionStorage.removeItem(STORAGE_KEY);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setSelections({
      serviceId: null,
      serviceName: null,
      serviceDuration: null,
      selectedDate: null,
      selectedTime: null,
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
          time={selections.selectedTime ?? ""}
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

      {/* Hold timer expiry banner */}
      {holdExpired && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">Az időpont foglalása lejárt</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Az Ön által kiválasztott időpont foglalása lejárt. Kérjük, válasszon új időpontot.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setHoldExpired(false);
              setSelections((prev) => ({ ...prev, selectedTime: null }));
              goToStep(2);
            }}
            className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors shrink-0"
          >
            Vissza az időpontokhoz
          </button>
        </div>
      )}

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
