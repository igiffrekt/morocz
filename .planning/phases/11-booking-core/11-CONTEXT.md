# Phase 11: Booking Core - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Patient can browse available slots on /idopontfoglalas, pick a service (Nőgyógyászat or Várandósgondozás), select a date and time, authenticate, confirm details, and receive a Hungarian confirmation email. Double-booking prevented at the data layer. Cancel and reschedule links in email.

</domain>

<decisions>
## Implementation Decisions

### Wizard Flow & Steps
- Linear wizard: Service → Date/Time → Auth → Confirm
- Step indicator at top showing progression
- Auth step auto-advances (skipped) if patient already has a session
- Back button on each step — selections preserved when going back
- First step is service selection (two services available)

### Services
- **Nőgyógyászat** — 20 perc
- **Várandósgondozás** — 20 perc
- Services managed in Sanity (admin can add/edit later)
- Each service has a name and duration
- Variable duration per service — longer services block consecutive 20-minute slots automatically

### Slot Display & Selection
- Calendar grid (monthly view) for date selection — available days highlighted, unavailable grayed out
- After selecting a date, time slots shown as a button grid (e.g., 9:00, 9:20, 9:40...)
- Base slot granularity: **20 minutes**
- Slots come from a **Sanity-managed schedule** (admin defines weekly availability)
- Booking window: **up to 30 days ahead**

### Confirmation & Feedback
- Confirmation step collects: name, email, phone — pre-filled from auth profile if available
- After booking: summary card with service, date, time + next steps (arrive early, bring ID, etc.)
- Confirmation email: **branded and warm** — clinic logo, warm Hungarian greeting, booking details, helpful tips, clinic contact info
- Email includes both **cancel and reschedule links**

### Conflict & Error Handling
- **Soft hold with timer**: selected slot reserved for ~5 minutes, countdown shown, expires if not confirmed
- On double-book conflict: show **3-5 nearest available slots** on same/next day — patient can pick alternative without restarting
- General errors (network, server): **inline Hungarian toast/banner** at top of current step with retry option

### Claude's Discretion
- Step indicator visual design (dots, progress bar, numbered steps)
- Exact calendar component implementation
- Loading/skeleton states during slot fetching
- Confirmation page layout and spacing
- Email HTML template structure
- Slot hold mechanism implementation details

</decisions>

<specifics>
## Specific Ideas

- URL is /idopontfoglalas (Hungarian)
- All UI text in Hungarian with proper accented characters
- The two services are medical: nőgyógyászat (gynecology) and várandósgondozás (prenatal care)
- Success page should include practical next steps (arrive early, what to bring)
- Confirmation email should feel professional but approachable — medical context, not e-commerce

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-booking-core*
*Context gathered: 2026-02-22*
