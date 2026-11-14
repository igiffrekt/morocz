import Image from "next/image";
import { PillLink } from "@/components/ui/PillButton";
import type { BookingServiceSlug } from "@/lib/booking-services";
import type { QuickBookingSchedule } from "@/lib/quick-booking";
import { urlFor } from "@/sanity/lib/image";
import type { HomepageQueryResult } from "../../../sanity.types";
import { ICON_PATHS, PathIcon } from "./PathIcon";
import { QuickBooking } from "./QuickBooking";

type DoctorImage = NonNullable<NonNullable<HomepageQueryResult>["heroDoctorImage"]>;

interface HomeHeroProps {
  subtitle?: string | null;
  doctorImage?: DoctorImage | null;
  serviceIds: Record<BookingServiceSlug, string | null>;
  schedule: QuickBookingSchedule;
}

/** A1 hero (navy card, doctor on a mint circle) with the quick-booking card overlapping its bottom. */
export function HomeHero({ subtitle, doctorImage, serviceIds, schedule }: HomeHeroProps) {
  const imageUrl = doctorImage?.asset ? urlFor(doctorImage).width(1040).url() : null;

  return (
    <section aria-labelledby="hero-title" className="relative">
      <div className="relative flex flex-col overflow-hidden rounded-panel bg-navy text-white lg:min-h-[720px] lg:flex-row lg:items-stretch lg:rounded-hero">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[length:26px_26px]"
        />

        <div className="relative flex flex-col justify-center gap-4 px-[22px] pt-[26px] sm:px-10 sm:pt-12 lg:flex-[1_1_560px] lg:gap-7 lg:py-[72px] lg:pr-0 lg:pb-[200px] lg:pl-16">
          <span className="fade-up inline-flex items-center gap-2 self-start rounded-full border border-white/14 bg-white/8 py-1.5 pr-3.5 pl-1.5 text-xs font-semibold whitespace-nowrap text-[#d6d9ec] lg:gap-2.5 lg:py-2 lg:pr-4 lg:pl-2 lg:text-[13px]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-mint text-navy lg:h-6 lg:w-6">
              <PathIcon
                d={ICON_PATHS.tick}
                size={12}
                strokeWidth={3}
                className="lg:h-3.5 lg:w-3.5"
              />
            </span>
            Dr. Mórocz Angéla · nőgyógyász szakorvos
          </span>
          <h1
            id="hero-title"
            className="fade-up m-0 max-w-[640px] text-[34px] leading-[1.06] font-extrabold tracking-[-0.02em] [--i:1] sm:text-5xl lg:text-[58px] lg:leading-[1.02] lg:tracking-[-0.025em] xl:text-[66px]"
          >
            Nőgyógyászat és várandósgondozás <span className="text-mint-light">Esztergomban</span>
          </h1>
          {subtitle && (
            <p className="fade-up m-0 max-w-[480px] text-[15px] leading-[1.55] text-navy-soft [--i:2] lg:text-[19px]">
              {subtitle}
            </p>
          )}
          <div className="fade-up hidden flex-wrap gap-3 [--i:3] sm:flex">
            <PillLink href="#foglalas" variant="pink" size="lg" arrow>
              Foglaljon időpontot
            </PillLink>
            <PillLink
              href="#szolgaltatasok"
              variant="ghost"
              size="lg"
              className="border-[1.5px] border-white/28 font-bold text-white hover:bg-white/8 hover:text-white"
            >
              Szolgáltatások és Árak
            </PillLink>
          </div>
        </div>

        <div className="relative -mt-0 flex h-[330px] items-end justify-center sm:h-[420px] lg:h-auto lg:min-h-[560px] lg:flex-[1_1_480px]">
          <div
            aria-hidden="true"
            className="absolute bottom-[-110px] left-1/2 h-[330px] w-[330px] -translate-x-1/2 rounded-full bg-mint sm:h-[420px] sm:w-[420px] lg:bottom-[-120px] lg:h-[600px] lg:w-[600px]"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-[-200px] left-1/2 hidden h-[760px] w-[760px] -translate-x-1/2 rounded-full border-[1.5px] border-mint-light/35 lg:block"
          />
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Dr. Mórocz Angéla"
              width={624}
              height={842}
              priority
              sizes="(min-width: 1024px) 512px, (min-width: 640px) 312px, 245px"
              className="relative block h-[330px] w-auto sm:h-[420px] lg:-mb-1.5 lg:h-[690px]"
            />
          )}
        </div>
      </div>

      <QuickBooking serviceIds={serviceIds} schedule={schedule} />
    </section>
  );
}
