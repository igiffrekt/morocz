# Phase 1: Foundation - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the project scaffolding: Next.js 16 App Router with TypeScript, Tailwind v4 design tokens, Motion v12 animation architecture, Plus Jakarta Sans font, ESLint/Biome linting, and a live Vercel deployment. No features — just the foundation that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User delegated all foundation decisions to Claude with the directive: **"Use best practices and follow the design."**

The following areas are at Claude's discretion:

- **Design token values** — Extract colors, border-radii, max-widths, and spacing from the template (`home_design/code.html`). Map them to Tailwind v4 theme configuration. Follow the template exactly.
- **Linting approach** — Choose between ESLint, Biome, or both based on current best practices for Next.js 16 projects. Prioritize developer experience and strictness.
- **Folder conventions** — Organize the project using standard Next.js App Router conventions. Structure components, lib, utils, and config folders for the full project lifecycle (8 phases of features).
- **Animation architecture** — Set up Motion v12 Server/Client boundary pattern. Create reusable animation wrapper components that later phases can import.
- **Deployment configuration** — Standard Vercel deployment with environment variables for Sanity (project ID, dataset, API token) ready for Phase 2.

</decisions>

<specifics>
## Specific Ideas

- The design template at `home_design/code.html` and `home_design/screen.png` is the source of truth for all visual tokens
- Animation reference frames exist in `animations/` directory (frame sequence from the original video `original-efb0bbd3b6d6b5a7f4ac58d13f64c5ce.mp4`)
- Stack is non-negotiable (from PROJECT.md): Next.js 16 App Router + Tailwind v4 + Sanity v5 + Motion v12 + Vercel
- AnimatePresence must NOT be used for inter-page transitions (App Router incompatibility)
- Motion v12 `motion/react-client` import path needs verification against official package exports

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-18*
