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

function loadGAScripts(gaId: string) {
  if (!gaId) return;
  if (document.getElementById("ga-script")) return; // already loaded

  const scriptSrc = document.createElement("script");
  scriptSrc.id = "ga-script";
  scriptSrc.async = true;
  scriptSrc.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(scriptSrc);

  const scriptConfig = document.createElement("script");
  scriptConfig.id = "ga-config";
  scriptConfig.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(scriptConfig);
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (!gaId) return;

    // Check if consent was already granted in a previous session
    const alreadyDismissed = localStorage.getItem("cookie-notice-dismissed");
    if (alreadyDismissed === "true") {
      loadGAScripts(gaId);
    }

    // Listen for consent being granted during this session
    function handleConsentGranted() {
      loadGAScripts(gaId);
    }

    window.addEventListener("cookie-consent-granted", handleConsentGranted);

    return () => {
      window.removeEventListener("cookie-consent-granted", handleConsentGranted);
    };
  }, [gaId]);

  return null;
}
