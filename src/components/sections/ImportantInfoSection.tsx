"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Spring configs ────────────────────────────────────────────────────────── */

const accordionSpring: Transition = { type: "spring", stiffness: 320, damping: 26 };

/* ── Card data ─────────────────────────────────────────────────────────────── */

interface InfoCard {
  id: string;
  icon: ReactNode;
  title: string;
  body: string;
  highlight?: string;
}

const cards: InfoCard[] = [
  {
    id: "idopontfoglalas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Időpontfoglalás",
    body: "Rendelésre bejelentkezni vagy időpontot egyeztetni kizárólag online lehetséges. Lemondani a foglalt időpontot maximum 1 nappal a rendelés előtt lehetséges.",
    highlight: "1 napon belüli lemondás díja: 10.000 Ft",
  },
  {
    id: "surgossegi-ellatas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: "Sürgősségi ellátás",
    body: "Telefonon csak a rendelési időben vagyunk elérhetőek. Sürgős esetben rendelési időben telefonon, rendelési időn kívül pedig e-mailben vegyék fel velünk a kapcsolatot.",
    highlight: "drmoroczangela@gmail.com",
  },
  {
    id: "gyogyszer-igenyeles",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    ),
    title: "Gyógyszer igénylés",
    body: "Rendszeresen szedett fogamzásgátló gyógyszerek igényét az alábbi e-mail címre jelezzék. Gyógyszert felírni csak a rendelési napokon tudunk.",
    highlight: "gyogyszer@drmoroczangela.hu",
  },
  {
    id: "leletek-beadasa",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: "Leletek beadása",
    body: "Leleteket, eredményeket az alábbi e-mail címre várjuk.",
    highlight: "drmoroczangela@gmail.com",
  },
  {
    id: "leletek-kuldese",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      </svg>
    ),
    title: "Leletek küldése",
    body: "Leletek elektronikus úton történő megküldése és kiértékelése kizárólag előzetes kérésem után történhet. Minden egyéb esetben személyes konzultáció szükséges az eredményekkel.",
    highlight: "Várandósgondozást elektronikus úton nem végzek",
  },
  {
    id: "diagnozis",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Diagnózis felállítása",
    body: "Elektronikus úton részletezett panaszok, tünetek és fotók alapján diagnózist felállítani nem tudok. Ilyen esetekben vizsgálat szükséges, kérem jelentkezzen be online időpontra.",
  },
  {
    id: "igazolasok",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M5 12h9" />
        <path d="m9 8-4 4 4 4" />
      </svg>
    ),
    title: "Igazolások kiállítása",
    body: "Elektronikus úton igazolást nem tudunk kiállítani. Időpontfoglalás nélkül, rendelési idő alatt személyes megjelenést követően állítjuk ki a kért igazolásokat.",
    highlight: "Szakorvosi igazolás díja: 10.000 Ft",
  },
  {
    id: "egyeb-kerdesek",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: "Egyéb kérdések",
    body: "Időpontfoglalással kapcsolatos, illetve egyéb technikai kérdéseiket az alábbi e-mail címre legyenek kedvesek írni.",
    highlight: "recepcio@drmoroczangela.hu · +36 70 639 5239",
  },
  {
    id: "egeszsegpenztar",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    title: "Egészségpénztár",
    body: "Egészségpénztárakkal nem állok szerződésben, ezért számlát nem tudok kiállítani.",
  },
  {
    id: "intimtorna",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
        <path d="M2 20h20" />
        <path d="M14 12v.01" />
      </svg>
    ),
    title: "Intimtorna tanfolyam",
    body: "Csoportos hétvégi tanfolyamok egyéni tornaterv átadásával és 1 hónapig online konzultációs lehetőséggel.",
    highlight: "40.000 Ft",
  },
  {
    id: "magzati-ultrahang",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M12 2a3 3 0 0 0-3 3c0 1.6.8 3 2 4l1 1 1-1c1.2-1 2-2.4 2-4a3 3 0 0 0-3-3z" />
        <path d="M9 12c-2.8 1-5 4-5 7.5 0 1.4 1.1 2.5 2.5 2.5h11c1.4 0 2.5-1.1 2.5-2.5 0-3.5-2.2-6.5-5-7.5" />
        <path d="M12 10v4" />
      </svg>
    ),
    title: "Magzati genetikai ultrahang",
    body: "Magzati genetikai ultrahangot nem végzek.",
    highlight: "Ajánlott intézmény: Czeizel Intézet, Budapest",
  },
];

/* ── Responsive column count hook ──────────────────────────────────────────── */

function useColumnCount() {
  const [count, setCount] = useState(2);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCount(w >= 1024 ? 3 : 2); // mobilon is 2 oszlop
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

/* ── Accordion card ────────────────────────────────────────────────────────── */

function AccordionCard({
  card,
  index,
  isOpen,
  onToggle,
}: {
  card: InfoCard;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-[0_2px_16px_rgba(36,42,95,0.04)] transition-[background-color,border-color,box-shadow] duration-500 ease-out hover:bg-white/80 hover:border-white/90 hover:shadow-[0_8px_32px_rgba(36,42,95,0.08)]">
      {/* Decorative number watermark */}
      <span className="absolute -top-2 -right-1 text-[4.5rem] font-black text-primary/[0.04] leading-none select-none pointer-events-none">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* ── Trigger ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full text-left relative z-10 flex items-center gap-2.5 p-4 md:px-5 cursor-pointer group"
      >
        {/* Icon */}
        <motion.span
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
          animate={{
            color: isOpen ? "rgba(36,42,95,1)" : "rgba(36,42,95,0.4)",
            backgroundColor: isOpen ? "rgba(36,42,95,0.1)" : "rgba(36,42,95,0.05)",
            borderColor: isOpen ? "rgba(36,42,95,0.15)" : "rgba(36,42,95,0.08)",
          }}
          style={{ borderWidth: 1 }}
          transition={{ duration: 0.35 }}
        >
          {card.icon}
        </motion.span>

        {/* Title */}
        <motion.span
          className="flex-1 text-[0.85rem] font-bold leading-snug"
          animate={{
            color: isOpen ? "rgba(36,42,95,1)" : "rgba(36,42,95,0.6)",
          }}
          transition={{ duration: 0.3 }}
        >
          {card.title}
        </motion.span>

        {/* Plus → X indicator */}
        <motion.span
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={accordionSpring}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <motion.path
              d="M8 1V15M1 8H15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{
                color: isOpen ? "rgba(36,42,95,0.8)" : "rgba(36,42,95,0.2)",
              }}
              transition={{ duration: 0.3 }}
            />
          </svg>
        </motion.span>
      </button>

      {/* Animated accent underline */}
      <motion.div
        className="absolute bottom-0 left-0 h-px bg-primary/40 origin-left"
        initial={false}
        animate={{ scaleX: isOpen ? 1 : 0 }}
        transition={accordionSpring}
      />

      {/* ── Expandable content ──────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { type: "tween", duration: 0.35, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 0.25, delay: 0.08 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { type: "tween", duration: 0.25, ease: [0.5, 0, 0.75, 0] },
                opacity: { duration: 0.12 },
              },
            }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-5 pb-4 md:pb-5 pl-[3rem] md:pl-[3.25rem]">
              <motion.p
                className="text-sm text-primary/70 leading-relaxed"
                initial={{ y: -6 }}
                animate={{ y: 0 }}
                exit={{ y: -6 }}
                transition={accordionSpring}
              >
                {card.body}
              </motion.p>

              {card.highlight && (
                <motion.div
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/[0.06] border border-primary/[0.1] rounded-full px-3 py-1.5"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                  {card.highlight}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shimmer on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}

/* ── Section ───────────────────────────────────────────────────────────────── */

export function ImportantInfoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const columnCount = useColumnCount();
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [expandedCol, setExpandedCol] = useState(-1);
  const [animateFlex, setAnimateFlex] = useState(false);
  const pendingCardRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  const handleToggle = (cardId: string) => {
    if (busyRef.current) return;

    if (openCardId === cardId) {
      // Closing: 1) height collapses, 2) column shrinks with animation
      busyRef.current = true;
      setOpenCardId(null);
      setTimeout(() => {
        setAnimateFlex(true);
        setExpandedCol(-1);
        setTimeout(() => {
          setAnimateFlex(false);
          busyRef.current = false;
        }, 350);
      }, 300);
      return;
    }

    if (openCardId !== null) {
      const oldIdx = cards.findIndex((c) => c.id === openCardId);
      const newIdx = cards.findIndex((c) => c.id === cardId);
      const sameColumn = oldIdx % columnCount === newIdx % columnCount;

      if (sameColumn) {
        // Same column: just swap content, no flex change
        busyRef.current = true;
        setOpenCardId(null);
        setTimeout(() => {
          setOpenCardId(cardId);
          busyRef.current = false;
        }, 300);
      } else {
        // Different column: close → shrink → expand new → open new
        busyRef.current = true;
        pendingCardRef.current = cardId;
        setOpenCardId(null);
        setTimeout(() => {
          setAnimateFlex(true);
          setExpandedCol(-1);
          setTimeout(() => {
            setAnimateFlex(false);
            const id = pendingCardRef.current;
            pendingCardRef.current = null;
            if (id) {
              const idx = cards.findIndex((c) => c.id === id);
              setExpandedCol(idx % columnCount);
              setOpenCardId(id);
            }
            busyRef.current = false;
          }, 350);
        }, 300);
      }
      return;
    }

    // Opening fresh: column expands instantly, then height animates
    const idx = cards.findIndex((c) => c.id === cardId);
    setExpandedCol(idx % columnCount);
    setOpenCardId(cardId);
  };

  // Distribute cards round-robin into fixed columns
  const columns = useMemo(() => {
    const cols: number[][] = Array.from({ length: columnCount }, () => []);
    cards.forEach((_, i) => cols[i % columnCount].push(i));
    return cols;
  }, [columnCount]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      /* ── Parallax background blobs ──────────────────────────────── */
      gsap.utils.toArray<HTMLElement>("[data-blob]").forEach((blob, i) => {
        gsap.to(blob, {
          y: i % 2 === 0 ? -90 : 70,
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      });

      /* heading reveal → Framer Motion whileInView kezeli */
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="fontos-tudnivalok-cim"
      className="relative overflow-hidden rounded-3xl bg-secondary"
    >
      {/* ── Mesh gradient blobs ───────────────────────────────────── */}
      <div
        data-blob
        className="hidden md:block absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40"
        style={{ background: "radial-gradient(circle, #99CEB7 0%, transparent 70%)" }}
      />
      <div
        data-blob
        className="hidden md:block absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-30"
        style={{ background: "radial-gradient(circle, #b8cfc0 0%, transparent 70%)" }}
      />
      <div
        data-blob
        className="hidden md:block absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full blur-[100px] opacity-20"
        style={{ background: "radial-gradient(circle, #c9a8d4 0%, transparent 70%)" }}
      />

      {/* ── Grain texture overlay ─────────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-3xl opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="relative z-10 p-6 md:p-10 lg:p-14">
        {/* Heading — Framer Motion whileInView, amount:0 = azonnal sül el */}
        <div className="mb-10 md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-primary/40 mb-4"
          >
            <span className="w-8 h-px bg-primary/20" />
            Információk
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            id="fontos-tudnivalok-cim"
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary leading-tight"
          >
            Fontos tudnivalók
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-3 text-base text-primary/45 max-w-lg"
          >
            Kérjük, az időpontfoglalás előtt olvassa el az alábbi információkat.
          </motion.p>
        </div>

        {/* ── Mobil: egyszerű egy oszlop ──────────────────────────── */}
        {columnCount === 1 && (
          <div className="flex flex-col gap-3">
            {cards.map((card, cardIndex) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.5,
                  delay: cardIndex * 0.04,
                  ease: [0.33, 1, 0.68, 1],
                }}
              >
                <AccordionCard
                  card={card}
                  index={cardIndex}
                  isOpen={openCardId === card.id}
                  onToggle={() => handleToggle(card.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Desktop: expanding column layout ────────────────────── */}
        {columnCount > 1 && (
          <div className="flex gap-4 items-start">
            {columns.map((colIndices, colIndex) => {
              const isActiveCol = colIndex === expandedCol;
              const flex =
                expandedCol === -1
                  ? 1
                  : isActiveCol
                    ? 1.5
                    : (columnCount - 1.5) / (columnCount - 1);

              return (
                <div
                  key={colIndex}
                  className="flex flex-col gap-4 min-w-0"
                  style={{
                    flex,
                    transition: animateFlex ? "flex 0.35s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
                  }}
                >
                  {colIndices.map((cardIndex) => (
                    <motion.div
                      key={cards[cardIndex].id}
                      initial={{ opacity: 0, y: 50, scale: 0.94 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        duration: 0.7,
                        delay: cardIndex * 0.06,
                        ease: [0.33, 1, 0.68, 1],
                      }}
                    >
                      <AccordionCard
                        card={cards[cardIndex]}
                        index={cardIndex}
                        isOpen={openCardId === cards[cardIndex].id}
                        onToggle={() => handleToggle(cards[cardIndex].id)}
                      />
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
