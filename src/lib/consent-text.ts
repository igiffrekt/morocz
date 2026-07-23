/** Consent checkbox label — displayed next to checkbox on registration/booking forms */
export const CONSENT_LABEL = "Elfogadom az adatkezelési tájékoztatót";

/** URL to the full privacy policy page */
export const PRIVACY_POLICY_URL = "/adatkezelesi-tajekoztato";

/**
 * Full consent text with link markup for React components.
 * Usage: <label><input type="checkbox" /> {CONSENT_LABEL} — <a href={PRIVACY_POLICY_URL}>részletek</a></label>
 * Or use the ConsentCheckbox component (Phase 10+).
 */
export const CONSENT_LINK_TEXT = "részletek";

/**
 * Booking / cancellation policy acceptance — a separate, explicit checkbox in the booking
 * flow. Kept apart from the privacy consent above so the patient accepts the 10.000 Ft
 * booking fee and the 48h cancellation rule as its own act, rather than bundled into a
 * data-protection consent.
 */
export const BOOKING_POLICY_LABEL = "Elfogadom a";

/** URL to the booking & cancellation policy page */
export const BOOKING_POLICY_URL = "/foglalasi-es-lemondasi-szabalyzat";
export const BOOKING_POLICY_LINK_TEXT = "Foglalási és Lemondási Szabályzatot";

/** URL to the terms of service page */
export const TERMS_OF_SERVICE_URL = "/felhasznalasi-feltetelek";
export const TERMS_OF_SERVICE_LINK_TEXT = "Felhasználási Feltételeket";
