"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import AuthStep from "@/components/auth/AuthStep";
import type { ScheduleForAvailability } from "@/lib/slots";
import { Step1Service } from "./Step1Service";
import { Step2DateTime } from "./Step2DateTime";
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

interface ScheduleData {
  schedule: ScheduleForAvailability;
  blockedDates: string[];
}

interface BookingWizardProps {
  services: ServiceItem[];
  scheduleData: ScheduleData;
}

const STEP_LABELS = ["Szolgáltatás", "Időpont", "Bejelentkezés", "Megerősítés"];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export function BookingWizard({ services, scheduleData }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const direction = useRef<number>(0);
  const [selections, setSelections] = useState<BookingSelections>({
    serviceId: null,
    serviceName: null,
    serviceDuration: null,
    selectedDate: null,
    selectedTime: null,
  });

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

  // Step key strings to avoid AnimatePresence key=0 bug (RESEARCH.md pitfall 6)
  function getStepKey(step: number): string {
    const keys: Record<number, string> = {
      1: "service",
      2: "datetime",
      3: "auth",
      4: "confirm",
    };
    return keys[step] ?? `step-${step}`;
  }

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
        return <AuthStep onSuccess={() => goToStep(4)} />;
      case 4:
        return (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-accent)]/20 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-8 h-8 text-[var(--color-accent)]"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-2">Megerősítés</h2>
            <p className="text-gray-600 mb-6">
              Ez a lépés a következő tervben kerül megvalósításra.
            </p>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left max-w-xs mx-auto space-y-2">
              <p>
                <span className="text-gray-500">Szolgáltatás:</span>{" "}
                <span className="font-medium">{selections.serviceName}</span>
              </p>
              <p>
                <span className="text-gray-500">Dátum:</span>{" "}
                <span className="font-medium">{selections.selectedDate}</span>
              </p>
              <p>
                <span className="text-gray-500">Időpont:</span>{" "}
                <span className="font-medium">{selections.selectedTime}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="mt-6 px-6 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Vissza
            </button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
      <StepIndicator currentStep={currentStep} steps={STEP_LABELS} />

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
}
