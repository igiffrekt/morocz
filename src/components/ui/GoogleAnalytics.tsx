"use client";

import { useEffect } from "react";
import { type Consent, CONSENT_EVENT, readConsent } from "@/lib/consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

interface GoogleAnalyticsProps {
  gaId: string;
}

// This client's GTM container carries the Google Ads conversion (+ conversion linker,
// enhanced conversions). Overridable via env, but falls back to the known container so a
// missing env var can't silently disable ad measurement on this single-tenant site.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-N3T6Z6DM";

// Consent Mode v2: everything starts fully denied, so nothing is stored on the visitor's
// device (and no ad data leaves) until they choose in the cookie banner. The denied default
// MUST be registered before gtag/GTM load — hence the inline script runs first.
function loadTagging(gaId: string) {
  if (document.getElementById("consent-default")) return; // already initialised

  const consentDefault = document.createElement("script");
  consentDefault.id = "consent-default";
  consentDefault.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = window.gtag || gtag;
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'wait_for_update': 500
    });
    gtag('js', new Date());
    ${gaId ? `gtag('config', '${gaId}');` : ""}
  `;
  document.head.appendChild(consentDefault);

  // GA4 stays on gtag (unchanged) — GA4 is configured here and NOT in GTM, so no double count.
  if (gaId) {
    const ga = document.createElement("script");
    ga.id = "ga-script";
    ga.async = true;
    ga.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(ga);
  }

  // GTM container — loads after the consent default, carries the Google Ads conversion.
  if (GTM_ID) {
    const gtm = document.createElement("script");
    gtm.id = "gtm-loader";
    gtm.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;
    document.head.appendChild(gtm);
  }
}

// One update governs every tag (GA4 on gtag + Google Ads in GTM read the same consent state).
function applyConsent(c: Consent) {
  window.gtag?.("consent", "update", {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
  });
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  useEffect(() => {
    loadTagging(gaId);

    // Re-apply a choice made in a previous session.
    const stored = readConsent();
    if (stored) applyConsent(stored);

    // Apply a choice made during this session (from the cookie banner).
    function onConsentChanged(e: Event) {
      const detail = (e as CustomEvent<Consent>).detail;
      if (detail) applyConsent(detail);
    }
    window.addEventListener(CONSENT_EVENT, onConsentChanged);
    return () => window.removeEventListener(CONSENT_EVENT, onConsentChanged);
  }, [gaId]);

  return null;
}
