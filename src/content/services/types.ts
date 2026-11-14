/**
 * Long-form service page copy (kept in code, see docs/redesign/PLAN.md). The shape mirrors
 * docs/redesign/content.json → service.<slug>; `nav` is the short chapter label used by the
 * mobile chapter bar.
 */

export type ServiceSlug = "nogyogyaszat" | "szuleszet" | "varandosgondozas" | "gyogyszerfeliras";

export interface ServiceCard {
  h: string;
  p: string;
}

export type ServiceBlock =
  | { t: "p"; x: string }
  | { t: "h3"; x: string }
  /** Check list; "Lead — rest" items render the lead in bold. */
  | { t: "ul"; items: string[] }
  /** Numbered timeline; "Title — description" items split into title + text. */
  | { t: "ol"; items: string[] }
  /** Colourful numbered card grid (swipe carousel on phones). */
  | { t: "cards"; items: ServiceCard[] };

export interface ServiceSection {
  h: string;
  /** Short label for the mobile chapter pill bar. */
  nav: string;
  blocks: ServiceBlock[];
}

export interface ServiceFaqItem {
  q: string;
  a: string;
}

export interface ServiceRelated {
  slug: ServiceSlug;
  h: string;
  s: string;
}

export interface ServiceContent {
  slug: ServiceSlug;
  title: string;
  /** [0] = hero lead, [1] = the large intro paragraph under the hero. */
  intro: string[];
  sections: ServiceSection[];
  faq: ServiceFaqItem[];
  cta: string;
  related: ServiceRelated[];
}
