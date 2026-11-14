import { ContactEmailPill } from "@/components/subpage/ContactPills";
import { Accordion } from "@/components/ui/Accordion";
import type { ServiceFaqItem } from "@/content/services/types";
import { cn } from "@/lib/cn";
import { FAQ_SECTION_ID, twoDigit } from "@/lib/service-page";
import type { ServiceMeta } from "./service-meta";

/** GYIK: intro + reception e-mail on the left, single-open numbered accordion (all closed). */
export function ServiceFaq({ faq, meta }: { faq: ServiceFaqItem[]; meta: ServiceMeta }) {
  if (!faq.length) return null;
  return (
    <section
      id={FAQ_SECTION_ID}
      aria-labelledby="gyik-cim"
      className="flex scroll-mt-[140px] flex-wrap items-start gap-5 pt-10 outline-none md:gap-10 lg:scroll-mt-6 lg:pt-0"
    >
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-2 px-1.5 md:gap-3.5 md:px-0">
        <span className="text-xs font-bold tracking-[.14em] text-teal-ink uppercase md:text-[13px]">
          GYIK · {meta.short}
        </span>
        <h2
          id="gyik-cim"
          className="m-0 text-[26px] leading-[1.05] font-extrabold tracking-[-0.03em] text-navy sm:text-[44px] lg:text-[52px]"
        >
          Gyakran ismételt kérdések
        </h2>
        <p className="m-0 hidden max-w-[420px] text-[17px] leading-[1.6] text-muted md:block">
          Időpontfoglalással kapcsolatos, illetve egyéb technikai kérdéseiket az alábbi e-mail címre
          legyenek kedvesek írni.
        </p>
        <ContactEmailPill className="mt-1.5 hidden h-[52px] self-start bg-white px-[22px] text-[15px] md:inline-flex" />
      </div>
      <Accordion
        className="min-w-0 flex-[2_1_640px] gap-2.5"
        itemClassName="rounded-[24px] md:rounded-tile"
        triggerClassName="group min-h-[60px] gap-3 rounded-[24px] py-3 pr-3.5 pl-[18px] hover:bg-transparent md:min-h-[76px] md:gap-[18px] md:rounded-tile md:px-5 md:py-4"
        titleClassName="text-[15px] leading-[1.35] md:text-lg"
        plusClassName="h-[34px] w-[34px] bg-canvas group-aria-expanded:bg-navy md:h-[42px] md:w-[42px]"
        contentClassName="px-[18px] pb-[18px] md:pr-7 md:pb-[26px] md:pl-[86px]"
        items={faq.map((item, i) => ({
          id: `k${i}`,
          title: item.q,
          icon: (
            <span
              key="szam"
              className={cn(
                "hidden h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-navy transition-colors duration-300 md:inline-flex",
                meta.tint,
                meta.faqOpen,
              )}
            >
              {twoDigit(i)}
            </span>
          ),
          content: (
            <p
              key="valasz"
              className="m-0 text-sm leading-[1.65] text-muted-strong md:text-base md:leading-[1.75]"
            >
              {item.a}
            </p>
          ),
        }))}
      />
    </section>
  );
}
