// Granular Consent Mode v2 state, shared between the cookie banner and the tag loader.
// "necessary" cookies are always allowed; the two optional categories map to Google's
// consent signals: analytics → analytics_storage, marketing → ad_storage/ad_user_data/
// ad_personalization (the latter gate Google Ads conversion measurement + Enhanced Conversions).

export type Consent = { analytics: boolean; marketing: boolean };

export const CONSENT_KEY = "cookie-consent-v2";
export const CONSENT_EVENT = "cookie-consent-changed";

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Consent>;
    return { analytics: !!p.analytics, marketing: !!p.marketing };
  } catch {
    return null;
  }
}

export function saveConsent(c: Consent): void {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: c }));
}
