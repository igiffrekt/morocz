---
status: passed
phase: 06-seo-structured-data
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, 06-04-SUMMARY.md, 06-05-SUMMARY.md]
started: 2026-02-21T00:00:00Z
updated: 2026-02-21T12:00:00Z
---

## Tests

### 1. Sanity Studio SEO fields
expected: In Sanity Studio, open SiteSettings — fields "siteName" and "defaultOgImage" are visible. Open Homepage — fields "metaDescription" and "ogImage" are visible. A "Privacy Policy" singleton exists with title, rich text body, and lastUpdated date.
result: PASS

### 2. Homepage OG meta tags
expected: View page source on the homepage. You should see meta tags for og:title, og:description, og:image, og:locale (hu_HU), and twitter:card (summary_large_image).
result: PASS

### 3. Blog post OG meta tags
expected: Open any blog post and view page source. You should see og:title, og:description, og:image, og:type="article", and article:published_time.
result: PASS

### 4. Homepage JSON-LD structured data
expected: View page source on the homepage. Search for "application/ld+json". MedicalClinic, LocalBusiness, and Physician schemas in a @graph array with real clinic data.
result: PASS

### 5. Blog post JSON-LD structured data
expected: Open any blog post and view page source. BreadcrumbList and BlogPosting JSON-LD present.
result: PASS

### 6. Privacy policy page
expected: Navigate to /adatkezelesi-tajekoztato. Page renders with header/footer, shows content from Sanity.
result: PASS

### 7. Cookie notice on first visit
expected: Clear localStorage and refresh. Cookie notice appears in Hungarian with link to privacy policy and "Rendben" button.
result: PASS

### 8. Cookie notice dismissal persists
expected: Click "Rendben", refresh — notice does not reappear.
result: PASS

### 9. Footer privacy policy link
expected: Footer contains clickable link to /adatkezelesi-tajekoztato.
result: PASS

### 10. Heading hierarchy
expected: One h1 (hero headline), each section uses h2.
result: PASS

### 11. Navbar hide on scroll down
expected: Scrolling down hides the navbar.
result: PASS

### 12. Compact navbar on scroll up
expected: Scrolling back up shows compact glassmorphism navbar.
result: PASS

### 13. Default navbar at top
expected: Scrolling to top restores full-width navbar.
result: PASS

### 14. Lab tests slide animation
expected: Pagination dots trigger horizontal slide animation.
result: PASS

## Summary

total: 14
passed: 14
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
