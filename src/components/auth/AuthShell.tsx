import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { HeroBreadcrumb } from "@/components/subpage/PageHero";
import { urlFor } from "@/sanity/lib/image";
import { getDoctorPortrait } from "@/sanity/lib/subpage-data";

const FACTS = [
  {
    t: "Online időpontfoglalás",
    b: "Rendelésre bejelentkezni vagy időpontot egyeztetni kizárólag online lehetséges.",
    icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  },
  {
    t: "Leletek az EESZT-ben",
    b: "Eredményeik az EESZT rendszerbe kerülnek feltöltésre, melyet lakossági portáljukon belépve tekinthetnek meg.",
    icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  },
  {
    t: "Átlátható árak",
    b: "A vizsgálati díjak tartalmazzák a mintakezelési, leletkezelési és adminisztrációs költséget is.",
    icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6",
  },
];

function Svg({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

interface AuthShellProps {
  /** Current page name for the breadcrumb. */
  crumb: string;
  children: ReactNode;
}

/**
 * Two-panel account layout (Belepes): navy brand panel with the three patient facts and
 * the doctor's portrait (Sanity homepage image), white form card on the right.
 */
export async function AuthShell({ crumb, children }: AuthShellProps) {
  const portrait = await getDoctorPortrait();
  const portraitUrl = portrait?.asset ? urlFor(portrait).width(560).url() : null;

  return (
    <section className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
      <div className="relative flex min-w-0 flex-col overflow-hidden rounded-[32px] bg-navy text-white lg:min-h-[760px] lg:flex-[1_1_520px] lg:rounded-hero">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[length:26px_26px]"
        />
        <div className="relative flex flex-col gap-4 px-5 py-6 sm:px-[clamp(24px,4vw,56px)] sm:pt-[clamp(28px,4vw,56px)] lg:gap-[22px] lg:pb-0">
          <HeroBreadcrumb crumbs={[{ label: crumb }]} />
          <span className="text-xs font-bold tracking-[.14em] text-mint-light uppercase sm:text-[13px]">
            Páciens fiók
          </span>
          <p className="m-0 max-w-[520px] text-[30px] leading-[1.06] font-extrabold tracking-[-0.03em] sm:text-[clamp(34px,3.6vw,48px)]">
            Foglaljon időpontot <span className="text-mint-light">percek alatt!</span>
          </p>
          <ul className="relative z-[2] m-0 flex max-w-[460px] list-none flex-col gap-3 p-0 max-lg:hidden">
            {FACTS.map((fact, i) => (
              <li
                key={fact.t}
                className="fade-up flex items-start gap-3.5 rounded-[28px] border border-white/10 bg-white/6 py-3.5 pr-[18px] pl-3.5"
                style={{ "--i": i * 1.3 } as CSSProperties}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-navy">
                  <Svg d={fact.icon} />
                </span>
                <span className="flex flex-col gap-[3px]">
                  <strong className="text-[15px] font-extrabold">{fact.t}</strong>
                  <span className="text-sm leading-[1.55] text-navy-soft">{fact.b}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden="true"
          className="relative -mt-10 flex min-h-[300px] flex-1 items-end justify-end max-lg:hidden"
        >
          <div className="absolute -right-[60px] -bottom-[150px] h-[440px] w-[440px] rounded-full bg-mint" />
          <div className="absolute -right-[120px] -bottom-[210px] h-[560px] w-[560px] rounded-full border-[1.5px] border-mint-light/35" />
          {portraitUrl && (
            <Image
              src={portraitUrl}
              alt=""
              width={560}
              height={756}
              sizes="282px"
              className="relative mr-2.5 -mb-1 block h-[380px] w-auto"
            />
          )}
        </div>
        <div className="float-y absolute bottom-9 left-[clamp(24px,4vw,56px)] z-[2] inline-flex items-center gap-3 rounded-full bg-white py-2.5 pr-5 pl-2.5 text-navy shadow-[0_20px_40px_-20px_rgba(0,0,0,.5)] max-lg:hidden">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sage text-teal-ink">
            <Svg d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          </span>
          <span className="flex flex-col">
            <strong className="text-sm">Dr. Mórocz Angéla</strong>
            <span className="text-xs font-semibold text-muted">nőgyógyász szakorvos</span>
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-[22px] rounded-[32px] bg-white p-5 sm:p-[clamp(24px,4vw,56px)] lg:flex-[1_1_440px] lg:rounded-hero">
        {children}
      </div>
    </section>
  );
}
