"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";

interface ServiceItem {
  _id: string;
  name?: string;
  appointmentDuration?: number;
}

interface ServiceSelectorProps {
  services: ServiceItem[];
  selectedServiceId: string | null;
  onSelect: (service: ServiceItem) => void;
  /** id of the visible heading that names the switch. */
  labelledBy: string;
}

/** The two booking choices are shown as "Nőgyógyászat" / "Várandósgondozás". */
export function serviceDisplayName(name: string | undefined | null): string {
  if (name?.startsWith("Nőgyógyász")) return "Nőgyógyászat";
  return name ?? "Ismeretlen szolgáltatás";
}

/**
 * Service switch (radiogroup with a sliding navy indicator). Nothing is preselected:
 * the indicator appears with the first choice; Várandósgondozás is only applied after
 * the prenatal notice has been acknowledged (handled by the wizard).
 */
export function ServiceSelector({
  services,
  selectedServiceId,
  onSelect,
  labelledBy,
}: ServiceSelectorProps) {
  return (
    <SegmentedControl
      labelledBy={labelledBy}
      options={services.map((s) => ({ value: s._id, label: serviceDisplayName(s.name) }))}
      value={selectedServiceId}
      onChange={(id) => {
        const service = services.find((s) => s._id === id);
        if (service) onSelect(service);
      }}
      className="h-[54px] max-w-[520px] sm:h-16 [&_button]:text-sm sm:[&_button]:text-[15px]"
    />
  );
}
