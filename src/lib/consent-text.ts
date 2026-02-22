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
