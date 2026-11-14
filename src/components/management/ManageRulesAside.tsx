import Link from "next/link";
import { ContactPhonePill } from "@/components/subpage/ContactPills";
import { pillClassName } from "@/components/ui/PillButton";
import { BOOKING_POLICY_URL } from "@/lib/consent-text";

const RULES = [
  {
    t: "Áthelyezés",
    b: "Díjmentesen, legkésőbb a foglalt időpontot megelőző 24 óráig. A foglalási díj automatikusan átvezetésre kerül az új időpontra.",
    icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM10 15l2 2 4-4",
  },
  {
    t: "Lemondás",
    b: "Bármikor, határidő nélkül lemondható. Legalább 48 órával előtte a teljes 10.000 Ft foglalási díjat visszatérítjük.",
    icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6",
  },
  {
    t: "48 órán belül",
    b: "A foglalási díj nem kerül visszatérítésre. 24 órán belül online áthelyezés már nem lehetséges – kérjük, hívja a rendelőt.",
    icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6",
  },
];

/** "Jó tudni" navy card (IdopontKezelese): reschedule / cancel / 48 h rules + call pill. */
export function ManageRulesAside() {
  return (
    <aside
      aria-label="Szabályok röviden"
      className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-[104px]"
    >
      <div className="flex flex-col gap-4 rounded-panel bg-navy p-6 text-white sm:rounded-[36px] sm:p-7">
        <span className="text-[13px] font-extrabold tracking-[.12em] text-mint-light uppercase">
          Jó tudni
        </span>
        {RULES.map((rule) => (
          <div key={rule.t} className="flex items-start gap-3.5 border-b border-white/10 pb-3.5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-mint-light">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={rule.icon} />
              </svg>
            </span>
            <div className="flex flex-col gap-1">
              <strong className="text-[15px] font-extrabold">{rule.t}</strong>
              <span className="text-sm leading-[1.55] text-navy-soft">{rule.b}</span>
            </div>
          </div>
        ))}
        <Link
          href={BOOKING_POLICY_URL}
          className={pillClassName({
            variant: "outline",
            fullWidth: true,
            className: "h-[52px] border-0 px-4 text-[13px] hover:text-navy",
          })}
        >
          Foglalási és Lemondási Szabályzat
        </Link>
      </div>
      <ContactPhonePill className="h-[54px] w-full" />
      <span className="text-center text-[13px] text-muted">
        Telefonon csak a rendelési időben vagyunk elérhetőek.
      </span>
    </aside>
  );
}
