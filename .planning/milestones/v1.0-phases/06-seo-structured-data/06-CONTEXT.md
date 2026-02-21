# Phase 6: SEO + Structured Data - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Every page gets correct meta tags, Open Graph data, and JSON-LD structured data. The homepage has MedicalClinic, LocalBusiness, and Physician schemas passing Google Rich Results Test. Blog posts have BreadcrumbList and BlogPosting JSON-LD. A Hungarian GDPR privacy policy page is accessible and linked from the footer. A cookie notice informs visitors without blocking page use. Semantic HTML is audited and corrected across the site.

Requirements: SEO-01 through SEO-09.

Note: SEO-08 (Core Web Vitals LCP/CLS/INP targets) will be primarily addressed in Phase 7 (Animation Polish + Performance). This phase establishes the baseline and avoids introducing regressions.

</domain>

<decisions>
## Implementation Decisions

### Structured Data (JSON-LD)

- Solo practice — Dr. Morocz is the only physician; single Physician schema entry
- Full credentials in Physician JSON-LD: name, medicalSpecialty, jobTitle, qualifications, memberOf (clinic), availableService
- MedicalClinic + LocalBusiness + Physician all on homepage
- BreadcrumbList + BlogPosting on each blog post page
- Clinic details (address, phone, opening hours, physician credentials) hardcoded in code — not stored as Sanity CMS fields (rarely changes)
- User will provide specific clinic details (address, hours, physician credentials) during implementation

### Privacy Policy Page

- User has existing Hungarian privacy policy text to provide (not drafting from scratch)
- Policy stored as a Sanity Portable Text document — editable from CMS without code deploys
- URL: `/adatkezelesi-tajekoztato` (full Hungarian legal term)
- Same header/footer layout as the rest of the site (not a minimal legal layout)
- New Sanity document type needed: privacyPolicy or legalPage singleton

### Cookie Notice

- Corner toast style (bottom-right or bottom-left small card) — not a full-width banner
- Permanent dismiss via localStorage as a placeholder implementation
- On live site, will be replaced by CookieYes or similar managed cookie consent platform
- Links to the privacy policy page (`/adatkezelesi-tajekoztato`)
- Matches site design system (navy/white/accent palette) — cohesive, not distracting
- Non-blocking — informational only per requirements (Vercel Analytics is cookie-free)

### Meta Tags & Open Graph

- New SEO fields added to SiteSettings in Sanity: defaultMetaDescription, defaultOgImage, siteName
- Site-wide fallback: any page without its own meta description falls back to SiteSettings.defaultMetaDescription
- User will provide a branded default OG image for social sharing
- Blog posts already have metaDescription and ogImage fields — use those when present, fall back to SiteSettings defaults
- All meta content in Hungarian (SEO-09)

### Claude's Discretion

- Whether to add homepage-specific metaDescription + ogImage fields to the Homepage singleton, or let it fall back to SiteSettings defaults (recommendation: add homepage fields for better social sharing control)
- Exact cookie notice placement (bottom-left vs bottom-right corner)
- Semantic HTML audit approach — how to systematically check heading hierarchy and landmarks across existing components
- Loading strategy for JSON-LD scripts (inline vs next/script)

</decisions>

<specifics>
## Specific Ideas

- Cookie notice is a temporary placeholder — CookieYes or similar will replace it on the production site
- Privacy policy content will be pasted by the user into Sanity; the developer just needs the schema + page + rendering
- Clinic details for JSON-LD will be provided by the user during implementation (not yet supplied)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-seo-structured-data*
*Context gathered: 2026-02-20*
