"use client";

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Desktop: all 4 steps visible */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={label} className="flex items-center flex-1">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className={[
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                    isCompleted
                      ? "bg-[var(--color-accent)] text-white"
                      : isActive
                        ? "bg-[var(--color-primary)] text-white shadow-md"
                        : "bg-gray-200 text-gray-500",
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={[
                    "text-xs font-medium whitespace-nowrap transition-colors duration-300",
                    isActive
                      ? "text-[var(--color-primary)]"
                      : isCompleted
                        ? "text-[var(--color-accent)]"
                        : "text-gray-400",
                  ].join(" ")}
                >
                  {label}
                </span>
              </div>

              {/* Connecting line (not after last step) */}
              {index < steps.length - 1 && (
                <div
                  className={[
                    "flex-1 h-0.5 mx-2 transition-colors duration-300",
                    isCompleted ? "bg-[var(--color-accent)]" : "bg-gray-200",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: only current step label */}
      <div className="md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {currentStep}
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {currentStep}. lépés / {steps.length}
            </p>
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              {steps[currentStep - 1]}
            </p>
          </div>
        </div>
        {/* Progress bar on mobile */}
        <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-500 rounded-full"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          />
        </div>
      </div>
    </div>
  );
}
