# Bento Pro redesign – implementation plan

Branch: `redesign/bento-pro` (go-live only after every phase is reviewed).
Design source of truth: `docs/redesign/canvas/*.dc.html` (exported from the Claude design canvas
https://claude.ai/artifact/D6DnNTdPHFPXUWDG2WpUVT). They are self-contained HTML mockups: inline styles,
`renderVals()` JS = the data/logic the page shows. Corrected long-form copy: `docs/redesign/content.json`.

## Non-negotiables
- Sanity is the single source of truth: prices (`service`/`serviceCategory`), schedule (weeklySchedule +
  seasonalSchedule + customAvailability + blockedDate, resolved exactly like `src/lib/slots.ts` /
  `/api/slots/availability`), yoga timetable + instructors, homepage texts. Never hard-code opening hours.
- Cancellation rule = 48 h everywhere (Szabályzat): ≥48 h before → 10 000 Ft foglalási díj refunded; <48 h → not.
- Booking service choice only "Nőgyógyászat" / "Várandósgondozás"; prenatal notice (yellow) under the summary card.
- Quick-booking day pills: only bookable days (schedule rules + `/api/slots/availability` available>0 for the
  chosen service), 3 lines (day / date / hours), never wrapping.
- All pills/buttons/chips: border-radius 999px, text always single-line (`whitespace-nowrap`; widen containers).
- No native `<select>` / `<input type="time|date">`; custom accessible controls; 24-hour times.
- Animations: CSS/`motion` – button lift + arrow nudge, press scale .97, underline-grow links, sliding tab
  indicators, grid-rows accordions (single-open, closed by default), staggered fade-ups; honour
  `prefers-reduced-motion`.
- Fontos tudnivalók + service-page copy stay in code, using the corrected text from `content.json`.
- Lélekző Jóga: live-like (full week calendar grid, instructor cards + modal, live hero photo); lotus only next to
  the nav label.

## Phases (each ends with `npm run build`, `npm run lint:biome`, `npm test`, screenshots at 1440 + 390)
1. Foundation – tokens in `globals.css`, shared UI primitives (PillButton/PillLink, SegmentedControl with sliding
   indicator, Tabs, Accordion, Chip, Sheet/Modal, SectionHeader), new `Header` (pill nav + lotus), new
   `MobileMenu` (full-screen circular reveal, staggered links, services submenu, quick actions, Sanity hours,
   CTA), new `Footer`, mobile sticky bottom action bar. Canvas: Header, Footer, MobilFejlec.
2. Homepage – A1 (hero, quick booking, Szolgáltatásaink price menu with + Felár, Fontos tudnivalók tabs + aside,
   Lélekző Jóga week strip, Vélemények slider, Blog) + MobilFooldal behaviours.
3. Subpages – Szolgáltatások és Árak (Arak), service template + 4 pages (Szolgaltatas, Nogyogyaszat, …),
   Kapcsolat, Lélekző Jóga (Joga), Blog post (BlogCikk), 404 (Hiba404). Keep `laborvizsgalatok/[slug]` working,
   restyled to the new tokens.
4. Booking – Időpontfoglalás wizard restyle (Idopontfoglalas), booking management (IdopontKezelese), auth /
   password reset (Belepes), success/cancelled pages. Logic/APIs unchanged.
5. Legal – shared legal template (Jogi) for the 5 documents.
6. Mobile polish & QA – match Mobil* artboards (bottom sheets, swipe rows, sticky chapter bars), a11y pass,
   cross-check every Sanity-driven value, Lighthouse.
