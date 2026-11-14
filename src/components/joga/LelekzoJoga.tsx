"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PillLink } from "@/components/ui/PillButton";
import { useNow } from "@/hooks/useNow";
import { budapestClock } from "@/lib/clinic-status";
import { cn } from "@/lib/cn";
import { nextSession, timetableDay, type YogaTimetable } from "@/lib/yoga";
import { YogaCalendar } from "./YogaCalendar";
import { YogaInstructors } from "./YogaInstructors";
import { ClassModal, InstructorModal } from "./YogaModals";

interface LelekzoJogaProps {
  headline: string;
  heroImageUrl: string | null;
  timetable: YogaTimetable;
}

const CLOCK_PATH = "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2";
const HERO_ALT = "Jógaszőnyeg hangtállal és párnákkal a Lélekző jógateremben";

type Open = { kind: "class"; id: string } | { kind: "instructor"; slug: string } | null;

/** Keeps the open modal in the URL (?ora=… / ?oktato=…) like the previous /joga page. */
function syncUrl(param: "ora" | "oktato" | null, value?: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete("ora");
  url.searchParams.delete("oktato");
  if (param && value) url.searchParams.set(param, value);
  window.history.replaceState(window.history.state, "", url);
}

export function LelekzoJoga({ headline, heroImageUrl, timetable }: LelekzoJogaProps) {
  const { sessions, classes, instructors } = timetable;
  const now = useNow();
  const clock = now != null ? budapestClock(now) : null;
  const today = clock ? timetableDay(clock) : null;
  const next = clock ? nextSession(sessions, clock) : null;
  const [open, setOpen] = useState<Open>(null);

  const openSession = useCallback(
    (id: string) => {
      setOpen({ kind: "class", id });
      const slug = sessions.find((s) => s.id === id)?.slug;
      if (slug) syncUrl("ora", slug);
    },
    [sessions],
  );
  const openInstructor = useCallback((slug: string) => {
    setOpen({ kind: "instructor", slug });
    syncUrl("oktato", slug);
  }, []);
  const close = useCallback(() => {
    setOpen(null);
    syncUrl(null);
  }, []);

  // Deep links from the old page / shared URLs.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ora = params.get("ora");
    const oktato = params.get("oktato");
    const session = ora ? sessions.find((s) => s.slug === ora) : undefined;
    if (session) setOpen({ kind: "class", id: session.id });
    else if (oktato && instructors.some((i) => i.slug === oktato)) {
      setOpen({ kind: "instructor", slug: oktato });
    }
  }, [sessions, instructors]);

  const openClass = open?.kind === "class" ? sessions.find((s) => s.id === open.id) : undefined;
  const openPerson =
    open?.kind === "instructor" ? instructors.find((i) => i.slug === open.slug) : undefined;

  const stats = [
    { n: sessions.length, l: "óra hetente" },
    { n: instructors.length, l: "oktató" },
    { n: classes.length, l: "óratípus" },
  ];

  const nextButton = next && (
    <button
      type="button"
      onClick={() => openSession(next.session.id)}
      aria-haspopup="dialog"
      className="btn-lift flex max-w-full min-w-0 items-center gap-3.5 rounded-full border-0 bg-white py-2.5 pr-[22px] pl-2.5 text-left text-navy shadow-[0_20px_40px_-20px_rgba(0,0,0,.45)]"
    >
      <span
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ background: next.session.color, color: next.session.ink }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={CLOCK_PATH} />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-xs font-bold tracking-[.08em] whitespace-nowrap text-muted uppercase">
          Következő óra · {next.when}
        </span>
        <span className="truncate text-base font-extrabold">
          {next.session.start} · {next.session.className}
        </span>
      </span>
    </button>
  );

  const breadcrumb = (className: string) => (
    <nav
      aria-label="Morzsamenü"
      className={cn(
        "inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-[13px] font-semibold whitespace-nowrap text-navy",
        className,
      )}
    >
      <Link href="/" className="link-grow tap-area text-muted hover:text-navy">
        Kezdőlap
      </Link>
      <span aria-hidden="true" className="text-[#9aa0b4]">
        /
      </span>
      <span aria-current="page">Lélekző Jóga</span>
    </nav>
  );

  return (
    <div className="flex flex-col">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section aria-label="Lélekző Jóga" className="flex flex-wrap items-stretch gap-4">
        {/* Desktop text panel */}
        <div className="hidden min-w-0 flex-[1_1_440px] flex-col justify-between gap-8 rounded-hero bg-sage p-10 text-navy md:flex xl:p-14">
          <div className="flex flex-col gap-[18px]">
            {breadcrumb("fade-up")}
            <span className="fade-up text-[13px] font-bold tracking-[.14em] text-yoga uppercase [--i:1]">
              Jóga órarend
            </span>
            <h1 className="fade-up m-0 text-[clamp(64px,7vw,96px)] leading-[.95] font-extrabold tracking-[-0.04em] [--i:1]">
              {headline}
            </h1>
            <p className="fade-up m-0 text-xl leading-normal text-muted-strong [--i:2]">
              Jógaközpontunk eseményei
            </p>
          </div>
          <div className="fade-up flex flex-col gap-5 [--i:3]">
            <ul aria-label="Számokban" className="m-0 flex list-none flex-wrap gap-2 p-0">
              {stats.map((st) => (
                <li
                  key={st.l}
                  className="inline-flex items-baseline gap-2 rounded-full bg-white px-5 py-2.5 whitespace-nowrap"
                >
                  <strong className="text-xl font-extrabold">{st.n}</strong>
                  <span className="text-sm font-semibold text-muted">{st.l}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2.5">
              <PillLink href="#orarend" variant="navy" arrow className="h-14 px-7 text-[15px]">
                Órarend
              </PillLink>
              <PillLink
                href="#oktatok"
                variant="outline"
                className="h-14 border-0 px-[26px] text-[15px] font-bold"
              >
                Oktatóink
              </PillLink>
            </div>
          </div>
        </div>

        {/* Photo card (Sanity yogaPage hero image) — carries the text on phones */}
        <div className="relative h-[420px] min-w-0 flex-[1.35_1_520px] overflow-hidden rounded-panel bg-[#c9d6cf] md:h-auto md:min-h-[520px] md:rounded-hero">
          {heroImageUrl && (
            <Image
              src={heroImageUrl}
              alt={HERO_ALT}
              fill
              priority
              sizes="(min-width: 768px) 60vw, 100vw"
              className="object-cover object-[42%_55%] md:object-[45%_60%]"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,42,95,.05)_30%,rgba(36,42,95,.82)_100%)] md:bg-[linear-gradient(180deg,rgba(36,42,95,0)_55%,rgba(36,42,95,.45)_100%)]"
          />
          {breadcrumb("absolute top-4 left-4 bg-white/90 px-3.5 py-1.5 text-xs md:hidden")}
          <div className="absolute right-5 bottom-5 left-5 flex flex-col gap-2.5 text-white md:hidden">
            <span className="text-xs font-extrabold tracking-[.14em] text-[#d4f0e8] uppercase">
              Jóga órarend
            </span>
            {/* Only one of the two h1s is displayed at a time (the other is display:none). */}
            <h1 className="m-0 text-5xl leading-[.95] font-extrabold tracking-[-0.035em]">
              {headline}
            </h1>
            <p className="m-0 text-[15px] text-[#e6e9f5]">Jógaközpontunk eseményei</p>
            <ul className="m-0 mt-1 grid list-none grid-cols-3 gap-1.5 p-0">
              {stats.map((st) => (
                <li
                  key={st.l}
                  className="flex flex-col items-center rounded-full border border-white/22 bg-white/16 px-2.5 py-2 backdrop-blur-[10px]"
                >
                  <strong className="text-lg leading-[1.1] font-extrabold">{st.n}</strong>
                  <span className="text-[11px] font-semibold whitespace-nowrap text-[#e6e9f5]">
                    {st.l}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {nextButton && (
            <div className="absolute bottom-6 left-6 hidden max-w-[calc(100%-48px)] md:flex">
              {nextButton}
            </div>
          )}
        </div>
        {nextButton && <div className="flex w-full min-w-0 md:hidden">{nextButton}</div>}
      </section>

      <YogaCalendar
        sessions={sessions}
        classes={classes}
        instructors={instructors}
        today={today}
        onOpenSession={openSession}
        onOpenInstructor={openInstructor}
      />

      <YogaInstructors instructors={instructors} sessions={sessions} onOpen={openInstructor} />

      <ClassModal
        session={openClass ?? null}
        instructor={
          openClass ? (instructors.find((i) => i.name === openClass.instructor) ?? null) : null
        }
        onClose={close}
        onOpenInstructor={openInstructor}
      />
      <InstructorModal
        instructor={openPerson ?? null}
        sessions={sessions}
        onClose={close}
        onOpenSession={openSession}
      />
    </div>
  );
}
