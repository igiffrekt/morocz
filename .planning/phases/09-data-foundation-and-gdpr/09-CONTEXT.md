# Phase 9: Data Foundation and GDPR - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Data contracts and legal prerequisites for patient booking. Sanity schemas for schedule and availability exist, GDPR obligations are satisfied (DPA, DPIA, privacy policy update), and the doctor's weekly schedule is configurable in Sanity Studio — all before any patient data enters the system.

</domain>

<decisions>
## Implementation Decisions

### Weekly schedule setup
- Default slot duration: 20 minutes
- No buffer time between appointments (0 min)
- Per-weekday schedule: each weekday has its own start/end time
- Doctor sets practicing hours manually for each day in Sanity Studio
- Each weekday has a "day off" checkbox to disable it entirely
- No pre-filled default hours — doctor configures everything

### Blocked dates & holidays
- Hungarian national holidays pre-populated yearly as blocked dates (March 15, Oct 23, etc.)
- Doctor can unblock pre-populated holidays if needed
- Date range selection: shift-click on desktop (click start, shift-click end to block all between)
- Mobile: press-and-slide gesture to select date ranges
- No individual date clicking for ranges — always range-based interaction
- No labels/reasons on blocked dates — blocked is blocked
- One-time blocking only, no yearly recurrence (re-add next year if needed)

### Service durations
- Universal 20-minute default for all services
- Duration field exists on each service document (defaulting to 20 min) for future flexibility
- Preset dropdown options only: 10, 15, 20, 30, 45, 60 minutes
- Multi-slot auto-calculation: if a service is 40 min and slots are 20 min, it blocks 2 consecutive slots

### Privacy policy content
- Existing Adatkezelesi tajekoztato page needs update — not created from scratch
- Claude drafts the Hungarian-language privacy policy addition covering booking data (name, email, phone)
- Doctor reviews the draft before publishing
- DPIA stored as markdown file in the repo (internal documentation, not public-facing)
- Consent checkbox: short text + link format — "Elfogadom az adatkezelesi tajekoztatot" with link to full policy page

### Claude's Discretion
- Sanity schema structure for schedule/availability documents
- Custom input component design for the calendar date picker in Studio
- DPIA document structure and content
- Hungarian national holiday list source and format
- Exact Sanity Studio field ordering and grouping

</decisions>

<specifics>
## Specific Ideas

- Shift-click range selection on desktop, press-and-slide on mobile for blocking dates — not one-by-one clicking
- Day off checkbox per weekday — simple toggle, not just "set hours to empty"
- Duration field uses preset dropdown (10/15/20/30/45/60) not free text input

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-data-foundation-and-gdpr*
*Context gathered: 2026-02-22*
