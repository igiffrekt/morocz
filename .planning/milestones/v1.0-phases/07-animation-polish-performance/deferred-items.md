# Deferred Items — Phase 07 Animation Polish

## Pre-existing Biome Lint Issues (Out of scope per SCOPE BOUNDARY rule)

These issues existed in the committed codebase before Plan 07-01 execution. They are not caused by plan changes and are deferred for cleanup.

### 1. ServicesSection.tsx — noSvgWithoutTitle (5 SVGs)
- **File:** `src/components/sections/ServicesSection.tsx`
- **Issue:** 5 category icon SVG elements in the `categoryIcons` constant lack `<title>` elements for accessibility
- **Rule:** Biome `lint/a11y/noSvgWithoutTitle`
- **Fix needed:** Add `aria-hidden="true"` to each SVG (they are decorative button icons with visible text labels) OR add `<title>` elements
- **Priority:** Medium (accessibility improvement)

### 2. LabTestsSection.tsx — useJsxKeyInIterable
- **File:** `src/components/sections/LabTestsSection.tsx`
- **Issue:** The `const card = (<div ...>)` variable inside `visibleTests.map()` lacks a `key` prop
- **Rule:** Biome `lint/correctness/useJsxKeyInIterable`
- **Fix needed:** The key is on the outer `<Link>` and `<div>` wrappers but not on the `card` variable itself. Biome sees the unkeyed `<div>` in the map function.
- **Priority:** Low (the actual rendered elements DO have keys via the Link/div wrappers)

### 3. IntroOverlay.tsx — noArrayIndexKey
- **File:** `src/components/motion/IntroOverlay.tsx`
- **Issue:** `CHARACTERS.map((char, i) => ... key={char-${i}})` uses array index as key
- **Rule:** Biome `lint/suspicious/noArrayIndexKey`
- **Fix needed:** Pre-index as `{pos, char}[]` array — characters are static so could also use biome-ignore with justification
- **Priority:** Low (static content, chars never reorder)
