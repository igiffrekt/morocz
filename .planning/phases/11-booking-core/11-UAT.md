---
status: complete
phase: 11-booking-core
source: 11-01-SUMMARY.md, 11-02-SUMMARY.md, 11-03-SUMMARY.md, 11-04-SUMMARY.md
started: 2026-02-22T16:30:00Z
updated: 2026-02-22T16:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Service Selection Page
expected: Navigate to /idopontfoglalas. Exactly 2 service cards: "Nőgyógyászat" and "Várandósgondozás" with duration. Selection highlights the card. "Tovább" enables after selection.
result: pass

### 2. Calendar and Month Navigation
expected: Step 2 shows a Hungarian calendar (Monday-first, H K Sze Cs P Szo V). Available dates are clickable, past dates and days off are grayed out. Month arrows navigate forward/back (bounded to today..today+30 days).
result: pass

### 3. Availability Stripes on Calendar
expected: Available day cells show a small colored stripe at the bottom — green if mostly open, amber if filling up, rose if nearly full. Days with no availability have no stripe.
result: pass

### 4. Time Slot Selection (Side-by-Side Layout)
expected: Clicking an available date shows time slots in a panel to the right of the calendar (70-30 ratio on desktop). Time slots are HH:MM buttons in a 2-column grid. Selecting one highlights it and enables "Tovább".
result: pass

### 5. Auth Gate After Slot Selection
expected: After selecting service + date + time and clicking "Tovább", step 3 shows login/register form with Google OAuth button. If already logged in, it auto-advances to step 4.
result: pass

### 6. Confirmation Step Pre-fill
expected: Step 4 (Megerősítés) shows a booking summary card (service, date, time). Name and email fields are automatically filled from your login. Only phone number needs manual entry.
result: pass

### 7. Booking Creates with Reservation Number
expected: After entering phone and clicking "Időpont foglalása", the booking is created and you see the success page with a reservation number (format: M-XXXXXX), service, date, and time in a summary card.
result: pass

### 8. Success Page Info Cards
expected: Success page shows 3 info cards — blue (email confirmation + Promotions folder tip), green (visit info: arrive early, bring TAJ card), amber (cancellation policy: 24h rule, 10,000 Ft fee). On desktop, blue and green are side by side; amber spans full width below.
result: pass

### 9. Booking Visible in Sanity Studio
expected: Open Sanity Studio → Időpontfoglalás → Foglalások. The booking you just created appears with patient name, reservation number, date, and time in the document list preview.
result: pass

### 10. Step Indicator Progress
expected: Throughout the wizard, the step indicator at the top shows 4 steps (Szolgáltatás, Időpont, Bejelentkezés, Megerősítés). The current step is highlighted, completed steps show as done.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
