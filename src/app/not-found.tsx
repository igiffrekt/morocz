import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import { PathIcon } from "@/components/home/PathIcon";
import { ContactStrip } from "@/components/layout/ContactStrip";
import { PillLink } from "@/components/ui/PillButton";

export const metadata: Metadata = {
  title: "Oldal nem található",
  robots: { index: false },
};

const HOME_PATH = "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z";
const COMPASS_PATH =
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z";
const SEARCH_PATH = "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35";

const QUICK = [
  {
    label: "Szolgáltatások és Árak",
    href: "/szolgaltatasok-es-arak",
    icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  },
  {
    label: "Időpontfoglalás",
    href: "/idopontfoglalas",
    icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  },
  {
    label: "Kapcsolat",
    href: "/kapcsolat",
    icon: "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  },
];

export default function NotFound() {
  return (
    <div className="flex flex-col gap-3 pb-6 md:gap-4 lg:pb-0">
      {/* Page-local keyframes (the global reduced-motion rule switches them off). */}
      <style>{`@keyframes nf-spin{to{transform:rotate(360deg)}}@keyframes nf-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
      <section className="relative flex flex-wrap items-stretch overflow-hidden rounded-panel bg-navy text-white md:min-h-[620px] md:rounded-hero">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[length:26px_26px]"
        />

        <div className="relative flex min-w-0 flex-[1_1_520px] flex-col items-start justify-center gap-5 px-[22px] pt-9 pb-2 md:gap-6 md:py-[72px] md:pr-8 md:pl-16">
          <span className="fade-up inline-flex items-center gap-2.5 rounded-full border border-white/14 bg-white/8 py-2 pr-4 pl-2 text-[13px] font-semibold whitespace-nowrap text-[#d6d9ec]">
            <span className="inline-flex h-[26px] items-center rounded-full bg-blush px-2.5 text-xs font-extrabold text-navy">
              404
            </span>
            Hibás vagy elavult hivatkozás
          </span>
          <h1 className="fade-up m-0 max-w-[600px] text-[clamp(38px,5.4vw,64px)] leading-[1.03] font-extrabold tracking-[-0.03em] [--i:1]">
            Az oldal nem <span className="text-mint-light">található</span>
          </h1>
          <p className="fade-up m-0 max-w-[480px] text-[17px] leading-[1.55] text-navy-soft [--i:2] md:text-[19px]">
            A keresett oldal nem létezik, vagy áthelyezésre került.
          </p>
          <PillLink
            href="/"
            variant="pink"
            size="lg"
            icon={<PathIcon d={HOME_PATH} size={18} strokeWidth={2.2} />}
          >
            Vissza a főoldalra
          </PillLink>
          <nav aria-labelledby="hasznos-oldalak" className="mt-2 flex flex-col gap-3">
            <span
              id="hasznos-oldalak"
              className="text-[13px] font-bold tracking-[.14em] text-mint-light uppercase"
            >
              Hasznos oldalak
            </span>
            <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
              {QUICK.map((q, i) => (
                <li key={q.href} className="fade-up" style={{ "--i": i + 3 } as CSSProperties}>
                  <PillLink
                    href={q.href}
                    variant="ghost"
                    icon={<PathIcon d={q.icon} size={17} strokeWidth={2} />}
                    className="h-12 border-[1.5px] border-white/28 px-5 text-sm font-bold text-white hover:border-white hover:bg-white hover:text-navy"
                  >
                    {q.label}
                  </PillLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div
          role="img"
          aria-label="404"
          className="relative flex min-h-[300px] flex-[1_1_520px] items-center justify-center overflow-hidden sm:min-h-[380px] md:min-h-[560px]"
        >
          <div
            aria-hidden="true"
            className="absolute h-[290px] w-[290px] animate-[nf-spin_40s_linear_infinite] rounded-full border-[1.5px] border-dashed border-mint-light/40 sm:h-[380px] sm:w-[380px] lg:h-[560px] lg:w-[560px]"
          />
          <div
            aria-hidden="true"
            className="absolute h-[230px] w-[230px] rounded-full bg-mint shadow-[inset_0_-30px_60px_-30px_rgba(36,42,95,.35)] sm:h-[300px] sm:w-[300px] lg:h-[440px] lg:w-[440px]"
          />
          <div
            aria-hidden="true"
            className="relative flex items-center text-[112px] leading-none font-extrabold tracking-[-0.06em] text-navy sm:text-[150px] lg:text-[210px]"
          >
            <span>4</span>
            <span className="relative mx-[.04em] inline-flex h-[.74em] w-[.74em] items-center justify-center rounded-full bg-white shadow-[0_30px_50px_-26px_rgba(16,20,60,.7)]">
              <PathIcon d={COMPASS_PATH} size={24} strokeWidth={2.2} className="h-[42%] w-[42%]" />
            </span>
            <span>4</span>
          </div>
          <span
            aria-hidden="true"
            className="absolute top-[18%] right-[14%] hidden animate-[nf-float_6s_ease-in-out_infinite] items-center gap-2.5 rounded-full bg-white py-2 pr-[18px] pl-2 text-sm font-extrabold whitespace-nowrap text-navy shadow-[0_18px_32px_-18px_rgba(16,20,60,.7)] sm:inline-flex"
          >
            <Image
              src="/mm-logo-square.svg"
              alt=""
              width={32}
              height={32}
              className="rounded-full"
            />
            Mórocz Medical
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-[17%] left-[15%] hidden h-16 w-16 animate-[nf-float_6s_ease-in-out_-3s_infinite] items-center justify-center rounded-full bg-blush text-navy shadow-[0_18px_32px_-18px_rgba(16,20,60,.7)] sm:inline-flex"
          >
            <PathIcon d={SEARCH_PATH} size={28} strokeWidth={2} />
          </span>
        </div>
      </section>

      <ContactStrip />
    </div>
  );
}
