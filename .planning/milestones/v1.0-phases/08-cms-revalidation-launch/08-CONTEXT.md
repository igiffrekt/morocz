# Phase 8: CMS Revalidation + Launch - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

An editor can publish a change in Sanity Studio and see it live on the production site within 30 seconds. The full editorial workflow (edit, preview, publish, verify) is tested. Contact CTAs work correctly. The site is launch-ready on drmoroczangela.hu with custom domain, error pages, and analytics.

</domain>

<decisions>
## Implementation Decisions

### Contact CTAs
- Phone only — no email link, no contact form
- Phone number sourced from Sanity siteSettings (CMS-editable)
- Placement: Header + Footer only (not in hero section)
- Tap behavior: Show confirmation dialog before dialing ("Hívja Dr. Morocz Angelát?" or similar)
- Standard `tel:` link underneath the confirmation UX

### Domain + Deployment
- Production domain: drmoroczangela.hu (currently has a WordPress site)
- Clean break from WordPress — no URL redirects needed (old site has minimal SEO value)
- Vercel deployment with custom domain DNS configuration

### Error Pages
- Branded 404 page matching site design (colors, fonts, layout)
- Link back to homepage from 404 page
- Hungarian language error messaging

### Analytics
- Google Analytics 4 tag for basic traffic tracking
- GDPR-aware: cookie notice already exists from Phase 6 — GA should respect consent

### Claude's Discretion
- Webhook revalidation architecture (HMAC validation, path-based vs tag-based)
- Draft preview mode implementation (preview secret, overlay bar design)
- GA4 integration approach (script tag vs next/third-parties)
- 404 page layout and messaging copy
- Confirmation dialog styling for phone CTA

</decisions>

<specifics>
## Specific Ideas

- Domain is drmoroczangela.hu — DNS will need to be pointed from current WordPress hosting to Vercel
- Phone confirmation prevents accidental calls (important for mobile UX on a medical site)
- The existing cookie notice from Phase 6 should integrate with GA consent

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-cms-revalidation-launch*
*Context gathered: 2026-02-21*
