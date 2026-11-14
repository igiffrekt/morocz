"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowIcon } from "@/components/ui/PillButton";
import type { YogaInstructor, YogaSession } from "@/lib/yoga";

interface YogaInstructorsProps {
  instructors: YogaInstructor[];
  sessions: YogaSession[];
  onOpen: (slug: string) => void;
}

function classNamesOf(person: YogaInstructor, sessions: YogaSession[]): string[] {
  return [...new Set(sessions.filter((s) => s.instructor === person.name).map((s) => s.className))];
}

function Placeholder() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-[#dfe3ea] text-[#9aa0b4]">
      <svg
        width="56"
        height="56"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      </svg>
    </span>
  );
}

/** "Oktatóink": live-style cards (desktop grid) / photo cards in a swipe row (phones). */
export function YogaInstructors({ instructors, sessions, onOpen }: YogaInstructorsProps) {
  if (instructors.length === 0) return null;

  return (
    <section
      id="oktatok"
      aria-labelledby="oktatok-cim"
      className="mt-10 flex scroll-mt-28 flex-col gap-3 md:mt-24 md:gap-10 md:rounded-hero md:bg-sage md:px-12 md:py-16"
    >
      <div className="flex flex-col gap-1 px-1.5 md:items-center md:gap-2.5 md:px-0 md:text-center">
        <span className="inline-flex items-center gap-3 text-xs font-extrabold tracking-[.14em] text-teal-ink uppercase md:text-[13px] md:font-bold">
          <span aria-hidden="true" className="hidden h-px w-8 bg-navy/25 md:block" />
          Oktatóink
          <span aria-hidden="true" className="hidden h-px w-8 bg-navy/25 md:block" />
        </span>
        <h2
          id="oktatok-cim"
          className="m-0 text-[26px] leading-[1.05] font-extrabold tracking-[-0.02em] text-navy md:text-[44px] md:tracking-[-0.03em] lg:text-[52px]"
        >
          Ismerd meg oktatóinkat
        </h2>
      </div>

      {/* Desktop / tablet grid */}
      <ul className="m-0 hidden list-none gap-5 p-0 md:grid md:[grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
        {instructors.map((person, index) => {
          const teaser = person.bio.join(" ") || classNamesOf(person, sessions).join(", ");
          return (
            <li key={person.id} className="fade-up" style={{ "--i": index } as CSSProperties}>
              <button
                type="button"
                onClick={() => onOpen(person.slug)}
                aria-haspopup="dialog"
                className="card-lift zoom-frame flex h-full w-full flex-col overflow-hidden rounded-tile border border-line-soft bg-white p-0 text-left text-navy"
              >
                <span className="relative block aspect-square w-full overflow-hidden bg-[#dfe3ea]">
                  {person.photoUrl ? (
                    <Image
                      src={person.photoUrl}
                      alt={person.name}
                      fill
                      sizes="(min-width: 1280px) 420px, (min-width: 768px) 45vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <Placeholder />
                  )}
                  <span
                    aria-hidden="true"
                    className="absolute right-0 bottom-0 left-0 h-[5px]"
                    style={{ background: person.color }}
                  />
                </span>
                <span className="flex flex-1 flex-col gap-2 px-6 pt-[22px] pb-6">
                  <span className="text-xl font-extrabold">{person.name}</span>
                  <span className="line-clamp-2 min-h-[44px] text-sm leading-[1.6] text-muted">
                    {teaser}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-extrabold">
                    Bemutatkozás <ArrowIcon size={16} className="card-go" />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Phone swipe row */}
      <ul
        aria-label="Oktatóink"
        className="scrollbar-none -mx-3 m-0 flex list-none snap-x snap-mandatory scroll-px-3 gap-2.5 overflow-x-auto px-3 pb-1.5 md:hidden"
      >
        {instructors.map((person) => {
          const classes = classNamesOf(person, sessions);
          return (
            <li
              key={person.id}
              className="relative flex h-[420px] w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-[30px] bg-[#c9d6cf]"
            >
              {person.photoUrl ? (
                <Image
                  src={person.photoUrl}
                  alt={person.name}
                  fill
                  sizes="80vw"
                  className="object-cover"
                />
              ) : (
                <Placeholder />
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,40,45,0)_38%,rgba(8,48,50,.88)_100%)]"
              />
              <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-extrabold tracking-[.08em] whitespace-nowrap text-yoga uppercase">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ background: person.color }}
                />
                Oktató
              </span>
              <div className="relative mt-auto flex flex-col gap-2.5 p-[18px] text-white">
                <h3 className="m-0 text-[22px] leading-[1.15] font-extrabold">{person.name}</h3>
                {classes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {classes.map((c) => (
                      <span
                        key={c}
                        className="max-w-full truncate rounded-full border border-white/24 bg-white/16 px-3 py-[5px] text-xs font-bold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onOpen(person.slug)}
                  aria-haspopup="dialog"
                  aria-label={`${person.name} bemutatkozása`}
                  className="tap-press inline-flex min-h-[46px] items-center gap-2 self-start rounded-full border-0 bg-white px-[18px] text-sm font-extrabold whitespace-nowrap text-yoga"
                >
                  Bemutatkozás
                  <ArrowIcon size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
