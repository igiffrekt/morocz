"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

interface GoogleAnalyticsProps {
  gaId: string;
}

// Consent Mode v2: the tag loads on every pageview but starts fully denied, so it
// stores nothing on the visitor's device until the cookie notice is accepted.
function loadGAScripts(gaId: string) {
  if (!gaId) return;
  if (document.getElementById("ga-script")) return; // already loaded

  // Must run before the gtag library so the denied default is in place first.
  const scriptConfig = document.createElement("script");
  scriptConfig.id = "ga-config";
  scriptConfig.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'wait_for_update': 500
    });
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(scriptConfig);

  const scriptSrc = document.createElement("script");
  scriptSrc.id = "ga-script";
  scriptSrc.async = true;
  scriptSrc.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(scriptSrc);
}

// Only analytics is granted — the site runs no ad tags, so the ad_* signals stay denied.
function grantAnalyticsConsent() {
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
  });
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (!gaId) return;

    loadGAScripts(gaId);

    // Consent granted in a previous session.
    if (localStorage.getItem("cookie-notice-dismissed") === "true") {
      grantAnalyticsConsent();
    }

    // Consent granted during this session.
    function handleConsentGranted() {
      grantAnalyticsConsent();
    }

    window.addEventListener("cookie-consent-granted", handleConsentGranted);

    return () => {
      window.removeEventListener("cookie-consent-granted", handleConsentGranted);
    };
  }, [gaId]);

  return null;
}
