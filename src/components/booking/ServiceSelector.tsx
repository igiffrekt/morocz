"use client";

interface ServiceItem {
  _id: string;
  name?: string;
  appointmentDuration?: number;
}

interface ServiceSelectorProps {
  services: ServiceItem[];
  selectedServiceId: string | null;
  onSelect: (service: ServiceItem) => void;
}

function displayName(name: string | undefined): string {
  if (name?.startsWith("Nőgyógyász")) return "Nőgyógyászat";
  return name ?? "Ismeretlen szolgáltatás";
}

export function ServiceSelector({ services, selectedServiceId, onSelect }: ServiceSelectorProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-[var(--color-primary)] mb-4">
        Válasszon szolgáltatást
      </h2>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="radiogroup"
        aria-label="Szolgáltatás"
      >
        {services.map((service) => {
          const isSelected = service._id === selectedServiceId;
          return (
            <button
              key={service._id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(service)}
              className={[
                "flex items-center justify-between gap-3 text-left rounded-2xl border-2 px-5 py-4 transition-all duration-200 cursor-pointer",
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md"
                  : "border-gray-200 bg-white hover:border-[var(--color-primary)]/40 hover:shadow-sm",
              ].join(" ")}
            >
              <span
                className={[
                  "font-bold text-base transition-colors",
                  isSelected ? "text-[var(--color-primary)]" : "text-gray-800",
                ].join(" ")}
              >
                {displayName(service.name)}
              </span>
              <span
                className={[
                  "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all",
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
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
