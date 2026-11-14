import Link from "next/link";
import { buildInfoGroups, pickInfoItems } from "@/components/home/info-content";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { ContactPhonePill } from "@/components/subpage/ContactPills";
import { ArrowIcon, pillClassName } from "@/components/ui/PillButton";
import type { ServiceSlug } from "@/content/services/types";
import { cn } from "@/lib/cn";
import type { WeekdayHours } from "@/lib/opening-hours";
import type { PriceMenuItem } from "@/lib/price-menu";
import { formatFt } from "@/lib/service-menu";
import { CLOCK_ICON, SERVICE_META } from "./service-meta";

export interface ServiceCardData {
  slug: ServiceSlug;
  rows: PriceMenuItem[];
  validityNote: string;
  week: WeekdayHours[];
}

export function cardTitle(slug: ServiceSlug): string {
  return slug === "szuleszet" ? "Rendelési idő" : "Árak";
}

function PriceRows({ rows, compact }: { rows: PriceMenuItem[]; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col", compact && "rounded-[26px] bg-lavender px-2.5 py-1")}>
      {rows.map((row, i) => (
        <div
          key={row.id}
          className={cn(
            "flex flex-col gap-1 py-[11px]",
            i < rows.length - 1 &&
              (compact ? "border-b border-navy/8" : "border-b border-[#eceef4]"),
          )}
        >
          <div className="flex items-end gap-2.5">
            <span className="max-w-[68%] text-sm leading-[1.35] font-bold md:text-[15px]">
              {row.name}
            </span>
            <span
              aria-hidden="true"
              className="mb-[5px] min-w-4 flex-1 border-b-2 border-dotted border-navy/22"
            />
            {row.price != null && (
              <span className="text-[15px] font-extrabold whitespace-nowrap tabular-nums md:text-base">
                {formatFt(row.price)}
              </span>
            )}
          </div>
          {row.note && <span className="text-[13px] leading-normal text-muted">{row.note}</span>}
        </div>
      ))}
    </div>
  );
}

/** "Fontos tájékoztatás várandós pácienseink részére" (same text as the booking wizard). */
function PrenatalNotice() {
  return (
    <div className="flex flex-col gap-2 rounded-[24px] bg-sun-soft px-5 py-[18px] text-sm leading-[1.6] text-muted-strong">
      <span className="flex items-center gap-2.5 text-[15px] font-extrabold text-navy">
        <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-sun">
          <PathIcon d={ICON_PATHS.alert} size={16} strokeWidth={2.2} />
        </span>
        Fontos tájékoztatás várandós pácienseink részére
      </span>
      <span>
        A <strong className="text-navy">24. várandóssági hét</strong> betöltését követően,
        amennyiben első alkalommal jelentkezik rendelőmben várandósgondozásra, a szükséges részletes
        állapotfelmérés és dokumentáció áttekintése érdekében kizárólag{" "}
        <strong className="text-navy">dupla időpont foglalásával</strong> tudom biztosítani az
        ellátását.
      </span>
      <span>
        A <strong className="text-navy">36. várandóssági héttől</strong> a szülésre választott
        intézmény szülészeti osztályát vagy a területileg illetékes szülészeti ügyeletet keresse
        fel.
      </span>
    </div>
  );
}

/** E-recept rule + medicine request address (Fontos tudnivalók copy). */
function PrescriptionNotes() {
  const [erecept, request] = pickInfoItems(buildInfoGroups({}), ["E-recept", "Gyógyszer igénylés"]);
  return (
    <>
      {erecept && (
        <div className="flex flex-col gap-2 rounded-[24px] bg-[#e1efee] px-5 py-[18px]">
          <span className="flex items-center gap-2.5 text-[15px] font-extrabold">
            <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-teal-ink text-white">
              <PathIcon d={ICON_PATHS.rx} size={15} strokeWidth={2.2} />
            </span>
            {erecept.title}
          </span>
          <span className="text-sm leading-[1.6] text-muted-strong">{erecept.body}</span>
        </div>
      )}
      {request && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] leading-[1.55] text-muted">{request.body}</span>
          {request.highlight && (
            <a
              href={`mailto:${request.highlight}`}
              className={pillClassName({
                variant: "ghost",
                size: "sm",
                className: "h-11 self-start bg-canvas px-[18px] text-sm",
              })}
            >
              <PathIcon d={ICON_PATHS.mail} size={16} strokeWidth={2} />
              {request.highlight}
            </a>
          )}
        </div>
      )}
    </>
  );
}

function WeekRows({ week }: { week: WeekdayHours[] }) {
  return (
    <div className="flex flex-col">
      {week.map((day) => (
        <div
          key={day.name}
          className="flex items-center justify-between gap-3 border-b border-[#eceef4] py-3 text-[15px] md:text-base"
        >
          <span className="font-bold">{day.name}</span>
          <span
            className={cn(
              "whitespace-nowrap tabular-nums",
              day.hours ? "font-extrabold text-teal-ink" : "text-muted",
            )}
          >
            {day.hours ?? "zárva"}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Body of the service hero card (and of the mobile price sheet): Sanity prices per service,
 * the prenatal notice, the e-prescription rule, or the opening hours for Szülészet.
 */
export function ServiceCardBody({ data, compact }: { data: ServiceCardData; compact?: boolean }) {
  const { slug, rows } = data;
  if (slug === "szuleszet") {
    return (
      <>
        <WeekRows week={data.week} />
        <span className="text-[13px] leading-[1.55] text-muted">
          Telefonon csak a rendelési időben vagyunk elérhetőek.
        </span>
        <ContactPhonePill className="h-[52px] w-full" />
      </>
    );
  }
  return (
    <>
      {rows.length > 0 && <PriceRows rows={rows} compact={compact} />}
      {slug === "varandosgondozas" && <PrenatalNotice />}
      {slug === "gyogyszerfeliras" && <PrescriptionNotes />}
    </>
  );
}

/** Hero card on the right of the service hero (desktop). */
export function ServiceHeroCard({ data }: { data: ServiceCardData }) {
  const meta = SERVICE_META[data.slug];
  const schedule = data.slug === "szuleszet";
  return (
    <div className="fade-up flex flex-col gap-3.5 rounded-panel bg-white p-[clamp(20px,3vw,30px)] text-navy shadow-[0_40px_80px_-40px_rgba(10,12,40,.65)] [--i:2]">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy",
              meta.tint,
            )}
          >
            <PathIcon d={schedule ? CLOCK_ICON : ICON_PATHS.coin} size={20} strokeWidth={2} />
          </span>
          <span className="text-[22px] font-extrabold tracking-[-0.01em]">
            {cardTitle(data.slug)}
          </span>
        </span>
        {!schedule && (
          <span className="rounded-full bg-canvas px-3.5 py-2 text-xs font-bold whitespace-nowrap">
            {data.validityNote}
          </span>
        )}
      </div>
      <ServiceCardBody data={data} />
      {!schedule && (
        <Link
          href="/szolgaltatasok-es-arak"
          className="btn-lift mt-0.5 flex min-h-[52px] items-center justify-between gap-2.5 rounded-full bg-navy py-0 pr-2.5 pl-[22px] text-sm font-extrabold whitespace-nowrap text-white no-underline hover:bg-navy-deep hover:text-white"
        >
          Teljes árlista és felárak
          <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/14">
            <ArrowIcon size={16} />
          </span>
        </Link>
      )}
    </div>
  );
}
