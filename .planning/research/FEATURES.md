# Feature Research

**Domain:** Single-practice medical practice website (Hungarian, Esztergom)
**Researched:** 2026-02-18
**Confidence:** HIGH (core table stakes well-established by multiple authoritative sources; differentiators verified by design-pattern analysis and current industry reports)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features patients assume exist. Missing these = practice feels unprofessional and users leave.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hero section with clear value proposition | First impression; establishes who you are, where you are, what you treat | LOW | Must include practice name, specialty, and location. CTA even without booking = "Kapcsolat" or phone. |
| Contact info visible in header | Patients need phone number immediately; many arrive from Google with urgent need | LOW | Phone number + address in sticky nav. 93% of medical site visitors have specific intent. |
| Services list / overview | Patients self-triage before visiting; they need to know you treat their condition | MEDIUM | Planned as 4 summary cards + detailed filterable section. Both are essential. |
| About the doctor | Credentials, training, years of experience build trust; 93% of patients say reviews/credibility affect provider choice | LOW | Photo, education, specialization, philosophy. Single-doctor practice = this is the brand. |
| Contact page (phone, address, hours) | Legal minimum for a business website; patients need to reach you | LOW | Map embed (Google Maps), opening hours, phone, email. |
| Mobile responsive design | 60%+ of medical web traffic is mobile; patients search on phones | MEDIUM | All sections must work at 320px–1440px. Animations must degrade gracefully on mobile. |
| Fast load speed (< 3 seconds) | 1-second delay = 20% conversion drop; Google uses Core Web Vitals for ranking | MEDIUM | Next.js image optimization, lazy loading, Framer Motion must not block LCP. |
| HTTPS / SSL | Patients distrust non-secure medical sites; browsers flag them | LOW | Handled by hosting (Vercel). Sanity API calls must use HTTPS. |
| Clear navigation (5–7 items max) | Confused users leave; medical patients have specific tasks, not browsing intent | LOW | Sticky header, hamburger on mobile, logical section order. |
| Footer with essential links | Legal pages, contact, social — patients who scroll expect this | LOW | Logo, address, phone, privacy policy, hours. |
| Patient testimonials | 93% of patients say reviews affect provider selection; trust is the #1 conversion factor | MEDIUM | Carousel is planned. Must feel authentic, not generic stock praise. |
| Blog / health content | Patients research symptoms; blog captures them at top of funnel and establishes authority | MEDIUM | Planned with categories. Drives SEO significantly for long-tail medical queries. |
| Privacy policy page | GDPR mandatory in Hungary/EU; failure = legal liability | LOW | Separate page; link in footer. Cookie consent banner required. |

---

### Differentiators (Competitive Advantage)

Features that set Morocz Medical apart from typical Hungarian single-doctor practices (most of which have outdated or minimal websites).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Advanced scroll-triggered animations (Framer Motion) | Premium feel signals quality of care; most Hungarian local practices have static sites; memorable experience drives word-of-mouth | HIGH | Planned: animated card shuffle on service filter, entrance animations, hero motion. Must not hurt Core Web Vitals — use `useReducedMotion`, lazy-load off-screen animations. |
| Services with animated category filter | Lets patients self-navigate to their specific need without reading walls of text; reduces time-to-decision | HIGH | Animated card shuffle/reorder is the signature interaction of this site. Implement with Framer Motion layout animations (`AnimatePresence` + `layout` prop). |
| Lab tests dedicated section | Many practices don't list lab services separately; surfacing this builds perceived comprehensiveness | MEDIUM | Static list is fine; CMS-editable in Sanity. Patients use this to prepare for visits. |
| Sanity CMS for all content | Doctor can update any text, image, or blog post without developer; keeps site current long-term | HIGH | Every section content element independently editable per project spec. Reduces client support burden significantly post-launch. |
| Structured data / schema markup | Increases probability of appearing in Google's AI Overviews, local 3-pack, and rich results; most local Hungarian competitors have zero schema | MEDIUM | Implement `MedicalClinic`, `Physician`, `LocalBusiness`, `FAQPage`, `BlogPosting` JSON-LD. High SEO ROI for minimal effort. |
| Authentic doctor photography | Generic stock photos undermine trust; real photos of the doctor and practice build immediate connection | LOW (content) | Technical complexity is LOW — implementation is image optimization. The differentiator is the decision to do it. |
| Google Maps embed | Esztergom is a small city; patients from surrounding areas (Dorog, Pilismarót, Párkány across the border) need navigation | LOW | Embed in contact section. Also helps local SEO entity signals. |
| Testimonials with names/context | Anonymous "Great doctor!" testimonials are distrusted; named testimonials with context (condition treated, outcome) convert | MEDIUM | Carousel planned. Each testimonial needs name, optional photo, and 2–3 sentences. CMS-editable. |
| Blog with category filtering | Demonstrates ongoing expertise; lets patients find relevant content; drives repeat visits and SEO | MEDIUM | Planned. Category filter + recency sort. Each post needs meta description and OG image for social sharing. |
| Open Graph / social meta tags | When patients share the site or a blog post, social cards appear correctly — signals professionalism | LOW | `next/head` or App Router metadata API. One-time setup; content populated from Sanity fields. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem valuable but create disproportionate complexity, maintenance burden, or user confusion for this specific project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Online appointment booking (v1) | Patients want self-service scheduling | Requires backend, calendar sync, notification system, GDPR-compliant data storage, potential HIPAA equivalent (ÁSZF), ongoing maintenance. Out of scope per project spec. | Prominent "Call to book" CTA + phone number in hero and sticky nav. Note: planned for v2 as separate system. |
| Patient portal / login | Patients want lab results online | Requires authentication, secure data storage, medical record compliance, massive scope increase. Entirely separate product. | Deliver lab results by phone or in-person per standard Hungarian practice. Out of scope permanently for this site. |
| Dark mode | Trendy, users expect it on apps | Per project spec, explicitly not building it. Adds 30–50% CSS complexity, doubles animation testing surface, risks color contrast failures. | Single high-quality light theme. Not a patient expectation for a medical practice site. |
| Multi-language (EN/HU) | Some patients may prefer English | Per project spec: Hungarian only. Multi-language requires URL routing strategy (subdirectory vs subdomain), translated CMS content, doubled content maintenance, hreflang tags. | If needed in v2, Next.js App Router i18n with Sanity localization is straightforward to add. |
| E-commerce / product shop | Nutritional supplements, medical devices | Adds payment processing (Stripe/Barion), inventory, shipping, VAT compliance, returns policy. Entirely different domain. | Not relevant for single-doctor medical practice. |
| Real-time chat widget | Instant patient communication | Medical advice via chat creates liability. Adds third-party script weight (Intercom, Tidio, etc.) that kills Core Web Vitals. | Contact form + phone. Keep it simple. |
| Doctor's personal blog separate from medical blog | Personal touch | Confuses site purpose, dilutes SEO signals, creates content maintenance burden. Two blogs = twice the work with half the traffic. | Single blog with content categories in Sanity. Doctor writes all posts; author = brand. |
| Cookie consent modal (full) | GDPR compliance appears to require it | If the site uses no tracking cookies (no GA, no marketing pixels), a simple informational notice suffices under GDPR. A heavy consent modal is overkill. | Implement minimal analytics (Vercel Analytics — privacy-first, no cookies). Display simple notice, not blocking modal. |
| Social media feed embeds | Shows active presence | Third-party embeds (Instagram, Facebook) add 200–500ms to load time, fail when APIs change, look dated, and pull users off the site. | Link to social profiles in footer. Don't embed feeds. |
| Video hero / video backgrounds | Premium feel | Autoplay video is 5–20MB; crushes mobile load times; accessibility issue for motion sensitivity. | High-quality static image + Framer Motion entrance animations achieve the same premium feel at 1/20th the data cost. |

---

## Feature Dependencies

```
[Contact Info (phone/address/hours)]
    └──required by──> [Hero CTA] (CTA needs a target)
    └──required by──> [Google Maps Embed]
    └──required by──> [Footer]
    └──required by──> [Schema Markup / LocalBusiness]

[Sanity CMS Setup]
    └──required by──> [Blog with categories]
    └──required by──> [Services (CMS-editable)]
    └──required by──> [Lab Tests section]
    └──required by──> [Testimonials (CMS-editable)]
    └──required by──> [Hero content (CMS-editable)]
    └──required by──> [About Doctor (CMS-editable)]

[Next.js Project Setup]
    └──required by──> [Framer Motion animations]
    └──required by──> [Structured Data (JSON-LD)]
    └──required by──> [SEO meta tags]
    └──required by──> [Sanity integration]

[Services Section (data model)]
    └──required by──> [Animated Category Filter] (filter needs categorized service data)
    └──required by──> [Service Schema Markup]

[Blog (data model in Sanity)]
    └──required by──> [Blog Category Filter]
    └──required by──> [BlogPosting Schema Markup]
    └──required by──> [Open Graph tags per post]

[Privacy Policy page]
    └──required by──> [Cookie notice] (notice must link to it)
    └──required by──> [GDPR compliance]

[Testimonials (Sanity)]
    └──enhances──> [About Doctor] (social proof supports credibility)
    └──enhances──> [Hero] (trust signals near primary CTA)

[Schema Markup]
    └──enhances──> [Blog] (BlogPosting schema per article)
    └──enhances──> [Services] (MedicalService schema)
    └──enhances──> [About Doctor] (Physician schema)

[Animations (Framer Motion)]
    └──conflicts with──> [Video hero] (both solve same problem; video wins on complexity loss)
    └──conflicts with──> [Heavy third-party scripts] (both hit Core Web Vitals; can't have both)
```

### Dependency Notes

- **Sanity CMS is the foundation dependency:** Every content section depends on it. Set up Sanity schemas first before building any content-bearing section.
- **Services data model before animated filter:** The filter is a UI enhancement on top of categorized service data — the category structure must be defined in Sanity before animation logic can be built.
- **Schema markup is late-stage, not foundation:** It depends on page structure being finalized. Build it after pages are stable to avoid rework.
- **Privacy Policy before launch, not before build:** Required legally but doesn't block development. Write it last.

---

## MVP Definition

### Launch With (v1)

This is what Morocz Medical needs to be credible and discoverable on day one.

- [ ] Hero section — clear headline, practice location (Esztergom), specialty summary, phone number CTA
- [ ] About the doctor — photo, credentials, philosophy (200–300 words)
- [ ] Services overview — 4 summary cards (planned)
- [ ] Services detailed section — categorized with animated filter
- [ ] Lab tests section — list of offered tests, CMS-editable
- [ ] Testimonials carousel — minimum 4 testimonials with names
- [ ] Blog — minimum 3 posts at launch, with category filter
- [ ] Contact section — phone, address, opening hours, Google Maps embed
- [ ] Footer — logo, links, privacy policy link
- [ ] Privacy policy page — GDPR mandatory
- [ ] SEO foundations — meta tags, Open Graph, JSON-LD schema (MedicalClinic, Physician, LocalBusiness)
- [ ] Mobile responsive across all sections
- [ ] Sanity CMS for all content elements

### Add After Validation (v1.x)

- [ ] FAQ section — add when blog analytics reveal repeated questions; also generates FAQPage schema
- [ ] More blog posts — ongoing content; trigger: 3 months post-launch
- [ ] Google Business Profile sync — verify GBP matches site schema exactly

### Future Consideration (v2+)

- [ ] Online appointment booking — planned as separate system per project spec; trigger: 100+ monthly site visitors
- [ ] Additional language (EN) — only if expat/cross-border patient base (Slovakia) materializes; Esztergom is on the Slovak border
- [ ] Patient portal / lab results — separate product entirely; requires medical data compliance

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hero + contact info | HIGH | LOW | P1 |
| About the doctor | HIGH | LOW | P1 |
| Services (4 cards + detailed) | HIGH | MEDIUM | P1 |
| Contact section + map | HIGH | LOW | P1 |
| Mobile responsive design | HIGH | MEDIUM | P1 |
| Testimonials carousel | HIGH | MEDIUM | P1 |
| Sanity CMS setup | HIGH | HIGH | P1 (foundation) |
| Privacy policy + cookie notice | HIGH (legal) | LOW | P1 |
| Animated service category filter | MEDIUM | HIGH | P1 (signature feature) |
| Lab tests section | MEDIUM | LOW | P1 |
| Blog with categories | MEDIUM | MEDIUM | P1 |
| SEO foundations (meta, OG, schema) | HIGH | MEDIUM | P1 |
| Core Web Vitals optimization | HIGH | MEDIUM | P1 |
| Framer Motion entrance animations | MEDIUM | MEDIUM | P2 |
| Open Graph per blog post | MEDIUM | LOW | P2 |
| FAQ section | MEDIUM | LOW | P2 |
| Social media profile links | LOW | LOW | P2 |
| Appointment booking | HIGH | HIGH | P3 (v2) |
| Patient portal | HIGH | VERY HIGH | P3 (separate product) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when core is working
- P3: Future consideration / separate project

---

## Competitor Feature Analysis

Hungarian local medical practice sites (general observation — no single dominant competitor):

| Feature | Typical Hungarian Local Practice | Budapest Private Clinic | Morocz Medical Plan |
|---------|----------------------------------|------------------------|---------------------|
| Mobile design | Often outdated/not responsive | Responsive | Fully responsive, first-class mobile |
| CMS / updateable content | Usually static HTML or WordPress | WordPress or custom | Sanity — fully editable |
| Animations | None | Minimal | Advanced Framer Motion throughout |
| Schema markup | Rarely implemented | Basic LocalBusiness | Full MedicalClinic, Physician, BlogPosting |
| Blog content | Rare | Occasional | Planned with categories, SEO-optimized |
| Lab tests listed | Rarely surfaced | Sometimes | Dedicated section |
| Testimonials | Rare | Present | Carousel, CMS-editable |
| Page speed | Often poor | Medium | Target: LCP < 2.5s, CLS < 0.1 |
| Appointment booking | Usually phone-only | Online booking | Phone-only v1 (booking planned v2) |

**Conclusion:** The Morocz Medical website will be meaningfully more advanced than the local Esztergom competition on every axis. The primary risk is over-engineering animations at the cost of page performance — that tradeoff requires active management during development.

---

## Sources

- [11 medical practice website must-haves — The Intake / Tebra](https://www.tebra.com/theintake/checklists-and-guides/digital-marketing/medical-practice-website-free-checklist) — HIGH confidence (verified checklist with data citations)
- [10 Features Every Medical Practice Website Needs in 2025 — Medical Practice Website Pros](https://www.medicalpracticewebpros.com/about/our-blog-for-medical-practice-web-information/52-10-features-every-medical-practice-website-needs-in-2025.html) — MEDIUM confidence (industry practitioner source)
- [Medical Practice Website Design by Specialty — Nopio](https://www.nopio.com/blog/medical-practice-website-design-by-specialty/) — MEDIUM confidence (web design agency with healthcare specialization)
- [Healthcare Website Navigation: 9 Best Practices — 314e](https://www.314e.com/practifly/blog/healthcare-website-navigation-best-practices/) — MEDIUM confidence (healthcare IT company)
- [10 Healthcare Website Design Mistakes to Avoid — Remedo](https://www.remedo.io/blog/healthcare-website-design-mistakes-to-avoid) — MEDIUM confidence (healthcare marketing firm)
- [Healthcare Schema Markup Guide — eSEOspace](https://eseospace.com/blog/schema-markups-for-medical-and-healthcare-websites/) — MEDIUM confidence (SEO specialist, schema.org aligned)
- [SEO for Doctors 2025 Ultimate Guide — PracticeBeat](https://www.practicebeat.com/blog/seo-for-doctors-2025-guide) — MEDIUM confidence (medical marketing specialist)
- [Schema Markup for Medical Practices — OctalFox](https://octalfox.com/schema-markup-for-medical-practices/) — MEDIUM confidence (corroborates schema.org types)
- [Schema.org Health and Medical Types — Official](https://schema.org/docs/meddocs.html) — HIGH confidence (authoritative specification)
- [Healthcare Website Accessibility Deadline 2026 — Carenetic Digital](https://careneticdigital.com/healthcare-website-accessibility-the-may-2026-deadline/) — MEDIUM confidence (regulatory deadline confirmed by HHS)
- [Healthcare Web Design Trends 2025 — Framerbite](https://framerbite.com/blog/20-best-healthcare-website-design-inspiration) — LOW confidence (design inspiration, not data-driven)
- [Best Practices for Healthcare UX — Eastern Standard](https://www.easternstandard.com/blog/the-10-best-ux-design-strategies-for-healthcare-websites/) — MEDIUM confidence (healthcare UX consultancy)

---
*Feature research for: Morocz Medical — single-practice medical website, Esztergom, Hungary*
*Researched: 2026-02-18*
