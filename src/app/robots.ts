import type { MetadataRoute } from "next";

const BASE_URL = "https://drmoroczangela.hu";

// Per-user, authenticated or token-bearing routes — nothing here belongs in an index.
const DISALLOW = [
  "/api/",
  "/admin",
  "/studio",
  "/foglalas/",
  "/profil/",
  "/claim/",
  "/jelszo-visszaallitas",
];

// Answer-engine crawlers. They are already covered by the "*" rule, but Google-Extended
// and Applebot-Extended are separate opt-outs, and naming the rest states the intent
// explicitly rather than leaving AI access to a default.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
