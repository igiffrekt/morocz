"use client";

import dynamic from "next/dynamic";

// Dynamically import IntroOverlay with ssr:false — this must live in a Client
// Component because next/dynamic with ssr:false is not allowed in Server Components.
// Dynamic import ensures IntroOverlay's JS (motion/react typewriter animation)
// is loaded in a separate chunk after the initial page render, improving TBT/TTI.
const IntroOverlay = dynamic(
  () => import("@/components/motion/IntroOverlay").then((m) => ({ default: m.IntroOverlay })),
  { ssr: false },
);

export function IntroOverlayLoader() {
  return <IntroOverlay />;
}
