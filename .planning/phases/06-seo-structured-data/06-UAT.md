---
status: testing
phase: 06-seo-structured-data
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, 06-04-SUMMARY.md, 06-05-SUMMARY.md]
started: 2026-02-21T00:00:00Z
updated: 2026-02-21T00:00:00Z
---

## Current Test

number: 1
name: Sanity Studio SEO fields
expected: |
  In Sanity Studio, open the SiteSettings document — you should see "siteName" and "defaultOgImage" fields. Open the Homepage document — you should see "metaDescription" and "ogImage" fields. Under the document list, there should be a "Privacy Policy" singleton document with a title, body (rich text), and lastUpdated date field.
awaiting: user response

## Tests

### 1. Sanity Studio SEO fields
expected: In Sanity Studio, open SiteSettings — fields "siteName" and "defaultOgImage" are visible. Open Homepage — fields "metaDescription" and "ogImage" are visible. A "Privacy Policy" singleton exists with title, rich text body, and lastUpdated date.
result: [pending]

### 2. Homepage OG meta tags
expected: View page source on the homepage. You should see meta tags for og:title, og:description, og:image, og:locale (hu_HU), and twitter:card (summary_large_image). Values come from Sanity SiteSettings (or homepage overrides if populated).
result: [pending]

### 3. Blog post OG meta tags
expected: Open any blog post and view page source. You should see og:title (post title), og:description (post meta description), og:image (post image or fallback), og:type="article", and article:published_time. A canonical URL should point to /blog/{slug}.
result: [pending]

### 4. Homepage JSON-LD structured data
expected: View page source on the homepage. Search for "application/ld+json". You should find a script containing MedicalClinic, LocalBusiness, and Physician schemas in a @graph array. Fields include phone, email, and placeholder comments for address/hours.
result: [pending]

### 5. Blog post JSON-LD structured data
expected: Open any blog post and view page source. Search for "application/ld+json". You should find BreadcrumbList (Kezdőlap > Blog > Post Title) and BlogPosting (headline, description, image, datePublished) schemas.
result: [pending]

### 6. Privacy policy page
expected: Navigate to /adatkezelesi-tajekoztato. The page renders with the same header and footer as the homepage. It shows either the Portable Text content from Sanity or placeholder text if no content is published yet. The page title includes "Adatkezelési tájékoztató".
result: [pending]

### 7. Cookie notice on first visit
expected: Clear localStorage and refresh the homepage. A small cookie notice toast appears in the bottom-right corner. Text is in Hungarian. It contains a link to /adatkezelesi-tajekoztato and a "Rendben" dismiss button.
result: [pending]

### 8. Cookie notice dismissal persists
expected: Click "Rendben" on the cookie notice. It disappears. Refresh the page — the notice should NOT reappear (stored in localStorage).
result: [pending]

### 9. Footer privacy policy link
expected: Scroll to the footer. There should be a clickable link for the privacy policy. Clicking it navigates to /adatkezelesi-tajekoztato.
result: [pending]

### 10. Heading hierarchy
expected: On the homepage, open DevTools accessibility tree or inspect headings. There should be exactly one h1 (the hero headline). Each section (Services, Lab Tests, Testimonials, Blog) should use h2.
result: [pending]

### 11. Navbar hide on scroll down
expected: On the homepage, scroll down. The navbar should slide up and disappear from view.
result: [pending]

### 12. Compact navbar on scroll up
expected: While scrolled down, scroll back up slightly. A compact glassmorphism navbar appears — it's about 70% width, centered, has a frosted glass background, contains only the logo icon (no text), menu items, and the CTA button.
result: [pending]

### 13. Default navbar at top
expected: Scroll all the way back to the top of the page. The original full-width navbar reappears with the full logo, address info, navigation links, and CTA.
result: [pending]

### 14. Lab tests slide animation
expected: In the Laborvizsgálatok section, click the pagination dots to switch pages. Cards should slide horizontally (left when going forward, right when going back) instead of fading.
result: [pending]

## Summary

total: 14
passed: 0
issues: 0
pending: 14
skipped: 0

## Gaps

[none yet]
