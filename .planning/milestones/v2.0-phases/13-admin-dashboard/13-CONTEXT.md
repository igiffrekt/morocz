# Phase 13: Admin Dashboard - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin-only dashboard at /admin where the doctor can view appointments by day, browse a calendar (month and week views), access patient contact details, and manually cancel bookings with email notification. No stat cards, no invoicing, no walk-in tracking. Auth infrastructure already exists from Phase 10.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout
- Two-panel layout: calendar on the left, selected day's appointments on the right
- No stat cards row at top — clean, direct into calendar + appointments
- Clicking a day in the calendar loads that day's appointments in the right panel
- Default view loads with today selected

### Appointment list (day panel)
- Each appointment row shows: time, patient name, service name, phone number
- Status badges: Confirmed / Cancelled only — no in-progress/done tracking
- Appointments listed in chronological order
- Rows are clickable — open patient detail modal

### Calendar views
- Month/Week toggle — user can switch between both views
- **Month view:** Full month grid, colored dots on days that have bookings
- **Week view:** Vertical timeline (Google Calendar style) — hours on the left, appointment blocks showing patient name and time range, color-coded blocks, day tabs at the top (like the reference image)
- In week view, clicking an appointment block also opens the patient detail modal

### Patient detail modal
- Centered modal/dialog overlay on click (from day list or week view)
- Shows: patient name, email (clickable mailto:), phone (clickable tel:), service, date/time, booking status
- Also shows patient's booking history (past and future appointments at the practice)
- Cancel action hidden in a three-dot (⋮) menu — not a direct button, to prevent accidental clicks

### Admin cancel flow
- Cancel option in three-dot menu inside the detail modal
- Confirmation dialog required: "Biztosan lemondja ezt az időpontot?" with patient name and date shown
- Optional reason field — if filled, included in the cancellation email
- Same 24-hour cancellation rule as patients — admin cannot cancel within 24h of appointment
- Cancellation email clearly states the clinic cancelled: "A rendelő lemondta az Ön időpontját" + optional reason
- Separate email template from patient self-cancel

### Claude's Discretion
- Exact color scheme for calendar dots and appointment blocks (should match existing site design system)
- Week view time slot granularity and hour range displayed
- Modal animation and transition style
- Empty state for days with no appointments
- Loading states for calendar and appointment data
- How booking history is sorted/displayed in the detail modal
- Responsive behavior (if admin uses mobile)

</decisions>

<specifics>
## Specific Ideas

- Reference dashboard: Medical dashboard with calendar left + day's appointments right, status badges per appointment, three-dot menus for actions
- Week view reference: Vertical timeline with hours on left, colored appointment blocks showing name + time range, day tabs across the top
- All UI strings in proper Hungarian with accented characters
- Phone and email should be directly actionable (tel: and mailto: links)
- Keep it clean and uncluttered — no stat cards, no walk-in tracking, no "upcoming appointment" hero section

</specifics>

<deferred>
## Deferred Ideas

- Revenue/weekly overview charts — could be a future analytics phase
- Walk-in appointment tracking — not needed for online booking system
- Invoice management — out of scope entirely

</deferred>

---

*Phase: 13-admin-dashboard*
*Context gathered: 2026-02-23*
