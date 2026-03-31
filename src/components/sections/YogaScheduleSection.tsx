"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { urlFor } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";

interface YogaScheduleItem {
  _id: string;
  yogaClass: {
    name: string;
    color?: string;
    icon?: string;
    description?: any[];
  };
  instructor: {
    name: string;
    color?: string;
    photo?: {
      asset?: {
        _ref: string;
      };
    };
  };
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  recurrence: string;
  location?: string;
  notes?: string;
}

interface YogaScheduleSectionProps {
  schedule: YogaScheduleItem[];
  showCta?: boolean;
  /** When true, opens modal in place without navigating to /joga */
  inlineModal?: boolean;
}

const DAYS = [
  { key: "monday", label: "Hétfő", slug: "hetfo", shortLabel: "H" },
  { key: "tuesday", label: "Kedd", slug: "kedd", shortLabel: "K" },
  { key: "wednesday", label: "Szerda", slug: "szerda", shortLabel: "Sze" },
  { key: "thursday", label: "Csütörtök", slug: "csutortok", shortLabel: "Cs" },
  { key: "friday", label: "Péntek", slug: "pentek", shortLabel: "P" },
  { key: "saturday", label: "Szombat", slug: "szombat", shortLabel: "Szo" },
  { key: "sunday", label: "Vasárnap", slug: "vasarnap", shortLabel: "V" },
];

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

const DEFAULT_COLORS = [
  "#76c8b6", // sage green
  "#e1bbcd", // dusty rose
  "#c4dfe6", // light blue
  "#f9e4b7", // light gold
  "#d4c4fb", // lavender
  "#ffd6cc", // coral
  "#fdf8eb", // cream
  "#e8f3ee", // mint
  "#ffebe4", // peach
  "#e7c1d3", // mauve
  "#b8d4e3", // sky blue
  "#c9e4ca", // pale green
];

function getClassDuration(startTime: string, endTime: string): number {
  const [startHours, startMins] = startTime.split(":").map(Number);
  const [endHours, endMins] = endTime.split(":").map(Number);
  return (endHours * 60 + endMins) - (startHours * 60 + startMins);
}

function getRecurrenceLabel(recurrence: string): string | null {
  if (recurrence === "biweekly-even") return "Páros hét";
  if (recurrence === "biweekly-odd") return "Páratlan hét";
  return null;
}

function getDayLabel(dayKey: string): string {
  return DAYS.find((d) => d.key === dayKey)?.label || dayKey;
}

function getNextOccurrence(dayKey: string): string {
  const dayIndex: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };
  const targetDay = dayIndex[dayKey] ?? 1;
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  const month = String(nextDate.getMonth() + 1).padStart(2, "0");
  const day = String(nextDate.getDate()).padStart(2, "0");
  return `${month}.${day}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function YogaScheduleSection({
  schedule,
  showCta = false,
  inlineModal = false,
}: YogaScheduleSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedClass, setSelectedClass] = useState<YogaScheduleItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const toggleFilter = (className: string) => {
    setActiveFilter((prev) => (prev === className ? null : className));
  };

  // Generate unique slug for each schedule item (class name + day in HU + time)
  const getDaySlug = (dayKey: string) => DAYS.find((d) => d.key === dayKey)?.slug || dayKey;
  const getItemSlug = (item: YogaScheduleItem) =>
    `${slugify(item.yogaClass.name)}-${getDaySlug(item.dayOfWeek)}-${item.startTime.replace(":", "")}`;

  // Open modal from URL on mount
  useEffect(() => {
    const ora = searchParams.get("ora");
    if (ora && schedule.length > 0) {
      const found = schedule.find((item) => getItemSlug(item) === ora);
      if (found) {
        setSelectedClass(found);
      }
    }
  }, [searchParams, schedule]);

  const openModal = (item: YogaScheduleItem) => {
    if (!inlineModal) {
      const slug = getItemSlug(item);
      router.push(`/joga?ora=${slug}`, { scroll: false });
    }
    setSelectedClass(item);
  };

  const closeModal = () => {
    if (!inlineModal) {
      router.push("/joga", { scroll: false });
    }
    setSelectedClass(null);
  };

  const scheduleByDay = DAYS.reduce(
    (acc, day) => {
      acc[day.key] = schedule
        .filter((item) => item.dayOfWeek === day.key)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    },
    {} as Record<string, YogaScheduleItem[]>
  );

  const allTimes = schedule.flatMap((item) => [item.startTime, item.endTime]);
  const minTime = allTimes.length > 0
    ? Math.min(...allTimes.map((t) => parseInt(t.split(":")[0])))
    : 8;
  const maxTime = allTimes.length > 0
    ? Math.max(...allTimes.map((t) => parseInt(t.split(":")[0]))) + 1
    : 20;

  const activeTimeSlots = TIME_SLOTS.filter((slot) => {
    const hour = parseInt(slot.split(":")[0]);
    return hour >= minTime && hour <= maxTime;
  });

  // Get unique class names sorted alphabetically for consistent color assignment
  const uniqueClassNames = [...new Set(schedule.map((item) => item.yogaClass.name))].sort();
  const classColors = new Map<string, string>();
  uniqueClassNames.forEach((className, index) => {
    const classItem = schedule.find((item) => item.yogaClass.name === className);
    classColors.set(
      className,
      classItem?.yogaClass.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    );
  });

  return (
    <section id="orarend" className="px-4 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <FadeIn direction="up">
          <div className="mb-12">
            <span className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-primary/40 mb-4">
              <span className="w-8 h-px bg-primary/20" />
              Jóga
            </span>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-primary">
                  Órarend
                </h2>
                <p className="mt-3 text-lg text-primary/60">
                  Jógaközpontunk eseményei
                </p>
              </div>
              {/* Desktop CTA - hidden on mobile, only shown when showCta is true */}
              {showCta && (
                <Link href="/joga" className="hidden md:inline-flex group relative items-center self-center">
                  {/* Left circle - hidden by default, scales in on hover */}
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-[#76c8b6] text-primary rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                    </svg>
                  </span>
                  {/* Pill - slides right on hover */}
                  <span className="inline-flex items-center h-12 rounded-full bg-[#76c8b6] text-primary px-6 font-bold text-sm whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-x-12">
                    Tovább a jóga oldalra
                  </span>
                  {/* Right circle - scales out to 0 on hover */}
                  <span className="w-12 h-12 flex items-center justify-center bg-[#76c8b6] text-primary rounded-full shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                    </svg>
                  </span>
                </Link>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Legend / Filter */}
        <FadeIn direction="up" delay={0.1}>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {Array.from(classColors.entries()).map(([name, color]) => {
              const isActive = activeFilter === null || activeFilter === name;
              return (
                <button
                  key={name}
                  onClick={() => toggleFilter(name)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    isActive ? "opacity-100 scale-100" : "opacity-40 scale-95"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  <span className="text-primary">{name}</span>
                </button>
              );
            })}
          </div>
        </FadeIn>

        {/* Desktop Schedule Grid */}
        <FadeIn direction="up" delay={0.2}>
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="grid border-b border-gray-300/75" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
              <div className="p-2 bg-gray-50"></div>
              {DAYS.map((day) => (
                <div
                  key={day.key}
                  className="p-4 bg-gray-50 font-semibold text-center text-primary"
                >
                  {day.label}
                </div>
              ))}
            </div>

            <div className="relative pb-4">
              {activeTimeSlots.map((timeSlot) => (
                <div
                  key={timeSlot}
                  className="grid border-b border-gray-300/75 last:border-b-0"
                  style={{ gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: "48px" }}
                >
                  <div className="p-2 text-sm text-gray-400 font-medium border-r border-gray-300/75 flex items-center justify-center">
                    {timeSlot}
                  </div>
                  {DAYS.map((day) => {
                    const daySchedule = scheduleByDay[day.key] || [];
                    const slotHour = parseInt(timeSlot.split(":")[0]);
                    // Find classes that start within this hour slot
                    const classesAtTime = daySchedule.filter((item) => {
                      const startHour = parseInt(item.startTime.split(":")[0]);
                      return startHour === slotHour;
                    });

                    return (
                      <div
                        key={`${day.key}-${timeSlot}`}
                        className="relative p-1 border-r border-gray-300/75 last:border-r-0"
                      >
                        {classesAtTime.map((item) => {
                          const duration = getClassDuration(item.startTime, item.endTime);
                          const heightSlots = duration / 60; // fractional: 90min = 1.5
                          const color = classColors.get(item.yogaClass.name) || DEFAULT_COLORS[0];
                          // Calculate offset within the hour (e.g., 08:30 = 0.5 * 48 = 24px offset)
                          const startMins = parseInt(item.startTime.split(":")[1]);
                          const offsetInSlot = (startMins / 60) * 48;
                          const isFiltered = activeFilter !== null && activeFilter !== item.yogaClass.name;

                          return (
                            <motion.button
                              key={item._id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: isFiltered ? 0.3 : 1, scale: 1 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => openModal(item)}
                              className="absolute inset-x-1 rounded-2xl px-3 py-1.5 cursor-pointer hover:shadow-md transition-shadow z-10 text-left"
                              style={{
                                backgroundColor: color,
                                height: `${heightSlots * 48 - 8}px`,
                                top: `${4 + offsetInSlot}px`,
                              }}
                            >
                              <div className="font-semibold text-sm text-primary truncate">
                                {item.yogaClass.name}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Mobile Schedule */}
        <div className="lg:hidden space-y-6">
          {DAYS.map((day, dayIndex) => {
            const daySchedule = scheduleByDay[day.key] || [];
            // Filter schedule if activeFilter is set
            const filteredDaySchedule = activeFilter
              ? daySchedule.filter((item) => item.yogaClass.name === activeFilter)
              : daySchedule;
            if (filteredDaySchedule.length === 0) return null;

            return (
              <FadeIn key={day.key} direction="up" delay={0.1 * dayIndex}>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="bg-primary text-white px-5 py-3 font-semibold">
                    {day.label}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {filteredDaySchedule.map((item) => {
                      const color = classColors.get(item.yogaClass.name) || DEFAULT_COLORS[0];

                      return (
                        <button
                          key={item._id}
                          onClick={() => openModal(item)}
                          className="flex items-center gap-4 p-4 w-full text-left hover:bg-gray-50 transition-colors"
                        >
                          <div
                            className="w-2 h-10 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-primary">
                              {item.yogaClass.name}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold text-primary">
                              {item.startTime}
                            </div>
                            <div className="text-sm text-gray-400">
                              {item.endTime}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {schedule.length === 0 && (
          <FadeIn direction="up" delay={0.2}>
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🧘</div>
              <p>Hamarosan frissül az órarend...</p>
            </div>
          </FadeIn>
        )}

        {/* Mobile CTA - hidden on desktop, only shown when showCta is true */}
        {showCta && (
          <FadeIn direction="up" delay={0.3}>
            <div className="mt-8 flex justify-center md:hidden">
              <Link href="/joga" className="group relative inline-flex items-center">
                {/* Left circle - hidden by default, scales in on hover */}
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-[#76c8b6] text-primary rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                  </svg>
                </span>
                {/* Pill - slides right on hover */}
                <span className="inline-flex items-center h-12 rounded-full bg-[#76c8b6] text-primary px-6 font-bold text-sm whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-x-12">
                  Tovább a jóga oldalra
                </span>
                {/* Right circle - scales out to 0 on hover */}
                <span className="w-12 h-12 flex items-center justify-center bg-[#76c8b6] text-primary rounded-full shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m0 0l-5-5m5 5l-5 5" />
                  </svg>
                </span>
              </Link>
            </div>
          </FadeIn>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedClass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", bounce: 0.25 }}
              className="bg-white rounded-3xl rounded-b-lg max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
              style={{ maxHeight: "577px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="p-6 pb-4 flex-shrink-0 relative"
                style={{
                  backgroundColor:
                    classColors.get(selectedClass.yogaClass.name) || DEFAULT_COLORS[0],
                }}
              >
                <button
                  onClick={() => closeModal()}
                  className="absolute top-4 right-4 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/50 flex items-center justify-center hover:bg-white/70 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="pr-12">
                  <h3 className="text-2xl font-bold text-primary">
                    {selectedClass.yogaClass.name}
                  </h3>
                  <p className="text-primary/70 mt-1">
                    {getNextOccurrence(selectedClass.dayOfWeek)}  •  {getDayLabel(selectedClass.dayOfWeek)}  •  {selectedClass.startTime} - {selectedClass.endTime}
                  </p>
                </div>
              </div>

              {/* Scrollable content */}
              <style>{`
                .yoga-modal-content::-webkit-scrollbar {
                  width: 8px;
                }
                .yoga-modal-content::-webkit-scrollbar-track {
                  background: transparent;
                }
                .yoga-modal-content::-webkit-scrollbar-thumb {
                  background: ${classColors.get(selectedClass.yogaClass.name) || DEFAULT_COLORS[0]};
                  border-radius: 4px;
                }
                .yoga-modal-content::-webkit-scrollbar-thumb:hover {
                  background: ${classColors.get(selectedClass.yogaClass.name) || DEFAULT_COLORS[0]}dd;
                }
              `}</style>
              <div
                className="yoga-modal-content flex-1 min-h-0 p-6 pb-8 space-y-4 overflow-y-auto"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: `${classColors.get(selectedClass.yogaClass.name) || DEFAULT_COLORS[0]} transparent`,
                } as React.CSSProperties}
              >
                {/* Instructor */}
                <div className="flex items-center gap-3">
                  {selectedClass.instructor.photo?.asset ? (
                    <img
                      src={urlFor(selectedClass.instructor.photo).width(80).height(80).url()}
                      alt={selectedClass.instructor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500">Oktató</div>
                    <div className="font-semibold text-primary">{selectedClass.instructor.name}</div>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {parseInt(selectedClass.startTime.split(":")[0]) < 12 ? (
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Időpont</div>
                    <div className="font-semibold text-primary">
                      {selectedClass.startTime} - {selectedClass.endTime}
                      {getRecurrenceLabel(selectedClass.recurrence) && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          ({getRecurrenceLabel(selectedClass.recurrence)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                {selectedClass.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Helyszín</div>
                      <div className="font-semibold text-primary">{selectedClass.location}</div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedClass.yogaClass.description && selectedClass.yogaClass.description.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="text-sm text-gray-500 mb-2">Leírás</div>
                    <div className="prose prose-sm prose-primary max-w-none text-gray-700">
                      <PortableText value={selectedClass.yogaClass.description} />
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedClass.notes && (
                  <div className="bg-gray-50 rounded-2xl p-4 mt-4">
                    <div className="text-sm text-gray-500 mb-1">Megjegyzés</div>
                    <div className="text-primary">{selectedClass.notes}</div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
