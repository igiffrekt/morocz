# Milestones

## v1.0 Morocz Medical (Shipped: 2026-02-21)

**Delivered:** A beautifully animated, SEO-optimized medical practice website with full Sanity CMS content management, GDPR compliance, and verified editorial workflow.

**Stats:**
- Phases: 1-8
- Plans: 29 total
- Commits: 124
- Files: 161 changed, 48,487 insertions
- Source: 4,621 LOC (TypeScript/TSX/CSS)
- Timeline: 4 days (2026-02-18 → 2026-02-21)

**Key accomplishments:**
1. Next.js 15 + Tailwind v4 + Motion v12 foundation with Biome linting and design tokens from template
2. Sanity v4 CMS with 8 document schemas, embedded Studio at /studio, TypeGen types, and 10+ centralized GROQ queries
3. Full homepage with animated hero (typewriter headline, staggered badges/cards), services filter with layout shuffle, lab tests grid, testimonials carousel, and blog section
4. Complete SEO stack: JSON-LD (MedicalClinic, Physician, BlogPosting, BreadcrumbList), Open Graph, semantic HTML with Hungarian ARIA labels, privacy policy, and GDPR cookie notice
5. Animation polish: intro typewriter overlay, scroll-triggered section entrances, circle wipe page transitions, reduced motion support throughout
6. Launch infrastructure: HMAC-validated webhook revalidation, draft mode preview with CDN bypass, GA4 with consent gate, branded 404, phone CTA dialog

**Known gaps:**
- BLOG-01: No separate blog listing page with category filters (deliberate architectural decision — homepage shows 2 latest posts)

**Archives:** milestones/v1.0-ROADMAP.md, milestones/v1.0-REQUIREMENTS.md, milestones/v1.0-MILESTONE-AUDIT.md

---


## v2.0 Booking Module (Shipped: 2026-02-23)

**Delivered:** A full online booking system — patients can self-book appointments, manage their bookings, and receive automated email reminders, while the admin manages everything through a role-gated calendar dashboard.

**Stats:**
- Phases: 9-14
- Plans: 17 total
- Commits: 96
- Files: 119 changed, 26,575 insertions, 3,302 deletions
- Timeline: 2 days (2026-02-21 → 2026-02-23)

**Key accomplishments:**
1. Sanity scheduling schemas (weeklySchedule, blockedDates) with custom Studio calendar input and Hungarian holiday generator
2. Patient auth via Better Auth (Google OAuth + email/password) and role-gated admin auth with Neon Postgres sessions
3. 4-step booking wizard at /idopontfoglalas with animated step transitions, double-booking prevention via ifRevisionID optimistic locking
4. Patient self-service at /foglalas/:token — cancel with 24h window enforcement, atomic reschedule with slot swap, Hungarian email notifications
5. Admin dashboard with month/week calendar views, overlapping booking layout, patient detail modal, and admin cancellation flow
6. Automated 24h reminder emails via Vercel Cron with DST-safe timezone handling, per-patient grouping, and idempotent delivery

**Known gaps:**
- GDPR-03: Sanity DPA signing (organizational — requires contacting Sanity support, not a code deliverable)

**Archives:** milestones/v2.0-ROADMAP.md, milestones/v2.0-REQUIREMENTS.md, milestones/v2.0-MILESTONE-AUDIT.md

---

