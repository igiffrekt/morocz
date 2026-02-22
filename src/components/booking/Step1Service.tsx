"use client";

interface ServiceItem {
  _id: string;
  name?: string;
  appointmentDuration?: number;
  icon?: unknown;
}

interface Step1ServiceProps {
  services: ServiceItem[];
  selectedServiceId: string | null;
  onSelect: (id: string, name: string, duration: number) => void;
  onNext: () => void;
}

export function Step1Service({ services, selectedServiceId, onSelect, onNext }: Step1ServiceProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">
        Válasszon szolgáltatást
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {services.map((service) => {
          const isSelected = service._id === selectedServiceId;
          const name = service.name ?? "Ismeretlen szolgáltatás";
          const duration = service.appointmentDuration ?? 20;

          return (
            <button
              key={service._id}
              type="button"
              onClick={() => onSelect(service._id, name, duration)}
              className={[
                "text-left rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer",
                "hover:shadow-md hover:scale-[1.01]",
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md"
                  : "border-gray-200 bg-white hover:border-[var(--color-primary)]/40",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3
                    className={[
                      "font-bold text-base mb-2 transition-colors",
                      isSelected ? "text-[var(--color-primary)]" : "text-gray-800",
                    ].join(" ")}
                  >
                    {name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Időtartam: <span className="font-semibold text-gray-700">{duration} perc</span>
                  </p>
                </div>

                {/* Selection indicator */}
                <div
                  className={[
                    "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                      : "border-gray-300",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="white"
                      className="w-full h-full"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Jelenleg nincs elérhető szolgáltatás.</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={selectedServiceId === null}
          className={[
            "px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
            selectedServiceId !== null
              ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 shadow-md hover:shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          Tovább
        </button>
      </div>
    </div>
  );
}
