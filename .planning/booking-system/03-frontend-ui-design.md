# Frontend UI Design -- Booking System

**Author**: frontend-architect
**Status**: Draft for review
**Date**: 2026-02-21
**Depends on**: `01-database-schema.md` (Drizzle ORM + Neon PostgreSQL)

---

## Table of Contents

1. [Design System Reference](#1-design-system-reference)
2. [Shared Components](#2-shared-components)
3. [Admin Panel](#3-admin-panel)
   - 3.1 [/admin/login](#31-adminlogin)
   - 3.2 [/admin (Dashboard)](#32-admin-dashboard)
   - 3.3 [/admin/appointments](#33-adminappointments)
   - 3.4 [/admin/appointments/[id]](#34-adminappointmentsid)
   - 3.5 [/admin/patients](#35-adminpatients)
   - 3.6 [/admin/patients/[id]](#36-adminpatientsid)
   - 3.7 [/admin/schedule](#37-adminschedule)
   - 3.8 [/admin/appointment-types](#38-adminappointment-types)
   - 3.9 [/admin/messages](#39-adminmessages)
   - 3.10 [/admin/waitlist](#310-adminwaitlist)
   - 3.11 [/admin/settings](#311-adminsettings)
   - 3.12 [/admin/users](#312-adminusers)
4. [Public Pages](#4-public-pages)
   - 4.1 [/idopontfoglalas (Multi-step booking)](#41-idopontfoglalas)
   - 4.2 [/idopontfoglalas/visszaigazolas](#42-idopontfoglalasvisszaigazolas)
   - 4.3 [/cancel/[token]](#43-canceltoken)

---

## 1. Design System Reference

All booking system pages must adhere to the existing design tokens, typography, motion patterns, and component conventions established across the marketing site.

### 1.1 Tailwind v4 @theme Tokens

Source: `src/app/globals.css`

```css
@theme {
  --font-sans: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif;

  --color-primary: #242a5f;           /* Dark navy -- headings, nav, buttons */
  --color-secondary: #F4DCD6;         /* Soft pink -- accents, CTA hover */
  --color-accent: #99CEB7;            /* Green -- CTA backgrounds, success */
  --color-yellow-card: #efda67;
  --color-green-card: #a3dac2;
  --color-purple-card: #e7c1d3;
  --color-blue-card: #91bcf5;
  --color-background-light: #F2F4F8;  /* Page backgrounds, card backgrounds */
  --color-surface-white: #FFFFFF;
  --color-text-light: #1A1D2D;        /* Body text */

  --radius-DEFAULT: 1rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;
  --radius-3xl: 2.5rem;

  --container-8xl: 88rem;
}
```

### 1.2 Typography

- **Font**: Plus Jakarta Sans, loaded via `next/font/google` in `src/lib/fonts.ts`
- **Weights used**: 400 (regular body), 500 (medium labels), 600 (semibold navigation), 700 (bold sub-headings), 800 (extrabold section headings)
- **Heading pattern**: `text-3xl md:text-4xl font-extrabold text-primary`
- **Body text**: `text-sm text-gray-600` or `text-base text-gray-700`
- **Price pattern**: `text-lg font-extrabold text-primary` with `toLocaleString("hu-HU")` + " Ft"

### 1.3 Layout Conventions

From `src/app/layout.tsx`:

```tsx
<div className="max-w-[88rem] mx-auto px-2 sm:px-3 lg:px-4 py-3 space-y-3">
  <Header />
  <main className="space-y-3">{children}</main>
  <Footer />
</div>
```

- Maximum container: `88rem` (1408px)
- Vertical rhythm between sections: `space-y-3` (0.75rem gap)
- Outer padding: `px-2 sm:px-3 lg:px-4`
- Sections use large border radius: `rounded-3xl` or `rounded-[2.5rem]`
- Section inner padding: `p-6 md:p-10` (white sections) or `px-6 py-12 md:px-10 md:py-16` (dark sections)

### 1.4 Card Patterns

Two card styles in use:

**Light card** (services, lab tests):
```
bg-background-light rounded-2xl p-5 flex flex-col gap-3
```

**Colored card** (hero cards):
```
bg-yellow-card rounded-[2rem] p-8 relative overflow-hidden h-[330px]
```

**Pastel card** (lab tests on dark background):
```
bg-[#ffebe4] rounded-2xl p-6 flex flex-col gap-3 min-h-[160px]
```

### 1.5 Motion Patterns

Library: `motion` v12 (imported from `"motion/react"`)

- **Global**: `<MotionConfig reducedMotion="user">` wraps entire app
- **Stagger children**: `container.visible.transition.staggerChildren: 0.1`
- **Fade-in items**: `{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }`
- **Exit animations**: `<AnimatePresence mode="popLayout">` or `mode="wait"`
- **Slide transitions**: `x: 300` enter, `x: -300` exit (used in LabTestsSection pagination)
- **Spring physics**: `type: "spring", bounce: 0.3` for interactive elements
- **Duration range**: 0.3s--0.6s for most transitions; 0.35s for slide transitions
- **Hover**: Tailwind `transition-all duration-700 ease-out` for slower, smooth hovers

### 1.6 Responsive Breakpoints

Mobile-first approach, matching Tailwind v4 defaults:
- `320px` -- minimum supported viewport width
- `sm` (640px) -- small tablets
- `md` (768px) -- tablets, desktop nav appears
- `lg` (1024px) -- desktop, 4-column grids
- `xl` (1280px) -- wide desktop, address info in header
- Maximum content: `88rem` (1408px)

### 1.7 Component Rendering Strategy

- **Server Components by default** -- all page-level components, data fetching, static layouts
- **`"use client"` only where required** -- interactive state (tabs, modals, form inputs, animations with user interaction)
- **Pattern from existing codebase**: Pages are Server Components that call `sanityFetch()` in parallel via `Promise.all()`, then pass data as props to client components

### 1.8 Language

All user-visible text is in **Hungarian**. No English text in the UI. Date/time formatting uses `hu-HU` locale. Calendar starts on Monday (ISO 8601).

---

## 2. Shared Components

Components listed here are reusable across the admin panel and/or public booking pages. Each component specifies its rendering mode.

### 2.1 AdminLayout

**File**: `src/components/admin/AdminLayout.tsx`
**Mode**: `"use client"` (sidebar toggle state, active route highlighting)

**Purpose**: Wraps all `/admin/*` pages with a persistent sidebar navigation and top header bar. Does NOT use the public Header/Footer from the marketing site.

**Structure**:
```
AdminLayout
  +-- AdminSidebar (left, collapsible on mobile)
  |     +-- Logo (link to /admin)
  |     +-- NavItem "Vezérlőpult" → /admin (icon: LayoutDashboard)
  |     +-- NavItem "Időpontok" → /admin/appointments (icon: Calendar)
  |     +-- NavItem "Betegek" → /admin/patients (icon: Users)
  |     +-- NavItem "Időbeosztás" → /admin/schedule (icon: Clock)
  |     +-- NavItem "Vizsgálat típusok" → /admin/appointment-types (icon: Tag)
  |     +-- NavItem "Üzenet sablonok" → /admin/messages (icon: Mail)
  |     +-- NavItem "Várakozók" → /admin/waitlist (icon: ListOrdered)
  |     +-- NavItem "Beállítások" → /admin/settings (icon: Settings)
  |     +-- NavItem "Felhasználók" → /admin/users (icon: Shield) [admin role only]
  |     +-- Divider
  |     +-- NavItem "Vissza a weboldalra" → / (icon: ExternalLink)
  +-- AdminHeader (top bar)
  |     +-- MobileMenuButton (md:hidden, toggles sidebar)
  |     +-- PageTitle (dynamic, passed via prop or context)
  |     +-- UserMenu: logged-in user name + dropdown (Kijelentkezés)
  +-- main content area (children)
```

**Visual spec**:
- Sidebar: `w-64` desktop, full overlay on mobile with backdrop blur
- Sidebar background: `bg-primary` (dark navy), text white
- Active nav item: `bg-white/10 rounded-xl` with `text-white font-bold`
- Inactive: `text-white/60 hover:text-white hover:bg-white/5`
- Header bar: `bg-white border-b border-gray-100 h-16 px-6`
- Content area: `bg-background-light min-h-screen p-6`

**Responsive behavior**:
- `< md`: Sidebar hidden by default; hamburger button reveals it as full-width overlay with `backdrop-blur-xl bg-black/20` behind
- `>= md`: Sidebar always visible, content shifts right

**Props**:
```ts
interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  user: { name: string; email: string; role: "admin" | "receptionist" };
}
```

### 2.2 DataTable

**File**: `src/components/admin/DataTable.tsx`
**Mode**: `"use client"` (sorting, pagination controls)

**Purpose**: Generic sortable, filterable, paginated table for admin list views (appointments, patients, waitlist, users).

**Props**:
```ts
interface Column<T> {
  key: keyof T | string;
  header: string;                    // Hungarian column label
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;  // custom cell renderer
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount: number;                // for server-side pagination display
  page: number;                      // current page (0-indexed)
  pageSize: number;                  // items per page (default 20)
  onPageChange: (page: number) => void;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;             // "Nincs talalat"
}
```

**Visual spec**:
- Table: `bg-white rounded-2xl overflow-hidden shadow-sm`
- Header row: `bg-background-light text-xs font-bold text-gray-500 uppercase tracking-wider`
- Body rows: `border-b border-gray-50 hover:bg-background-light/50 transition-colors cursor-pointer` (when `onRowClick` provided)
- Sort indicators: chevron up/down icons next to sortable column headers
- Pagination bar at bottom: `"1-20 / 2 320"` with Previous/Next buttons
  - "Elozo" (Previous), "Kovetkezo" (Next) button labels
  - Page number display: `"{from}-{to} / {total}"`
- Loading state: Skeleton rows (6 rows of gray pulsing bars matching column widths)
- Empty state: Centered message in table body area

**Responsive behavior**:
- `< md`: Horizontal scroll with `overflow-x-auto`
- `>= lg`: Full table visible

### 2.3 StatusBadge

**File**: `src/components/admin/StatusBadge.tsx`
**Mode**: Server Component (no interactivity)

**Purpose**: Renders color-coded pill badges for appointment and waitlist statuses.

**Mapping**:
```ts
const statusConfig: Record<string, { label: string; className: string }> = {
  // Appointment statuses
  confirmed:  { label: "Visszaigazolva", className: "bg-green-100 text-green-800" },
  cancelled:  { label: "Lemondva",       className: "bg-red-100 text-red-800" },
  completed:  { label: "Teljesitve",     className: "bg-blue-100 text-blue-800" },
  no_show:    { label: "Nem jelent meg", className: "bg-gray-100 text-gray-600" },

  // Waitlist statuses
  waiting:    { label: "Varakozik",  className: "bg-yellow-100 text-yellow-800" },
  notified:   { label: "Ertesitve", className: "bg-blue-100 text-blue-800" },
  booked:     { label: "Foglalt",    className: "bg-green-100 text-green-800" },
  expired:    { label: "Lejart",     className: "bg-gray-100 text-gray-600" },
};
```

**Rendering**: `<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold {className}">{label}</span>`

### 2.4 DatePicker

**File**: `src/components/ui/DatePicker.tsx`
**Mode**: `"use client"` (calendar interaction state)

**Purpose**: Hungarian-locale date picker used in admin forms (schedule overrides, date filters) and the public booking calendar (Step 2).

**Behavior**:
- Displays a month grid with Monday as first day of week
- Hungarian month names: `"Januar", "Februar", "Marcius", "Aprilis", "Majus", "Junius", "Julius", "Augusztus", "Szeptember", "Oktober", "November", "December"`
- Hungarian day abbreviations: `"H", "K", "Sze", "Cs", "P", "Szo", "V"`
- Navigation: left/right chevrons to change month, month+year header text
- Disabled dates rendered with `opacity-30 cursor-not-allowed`
- Selected date: `bg-primary text-white rounded-xl`
- Today: `ring-2 ring-primary/20`
- Available dates (public booking): `bg-accent/20 hover:bg-accent/40 rounded-xl`
- Supports `minDate`, `maxDate`, `disabledDates: Date[]`, `availableDates: Date[]` props
- Animation: month transitions use `<AnimatePresence mode="wait">` with horizontal slide (direction based on prev/next)

**Props**:
```ts
interface DatePickerProps {
  selected?: Date | null;
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  availableDates?: Date[];         // if provided, only these dates are selectable
  className?: string;
}
```

**Visual spec**:
- Container: `bg-white rounded-2xl p-6 shadow-sm`
- Month header: `text-lg font-bold text-primary`
- Day cells: `w-10 h-10 flex items-center justify-center text-sm font-medium rounded-xl transition-colors`
- Grid: `grid grid-cols-7 gap-1`

### 2.5 DateRangePicker

**File**: `src/components/ui/DateRangePicker.tsx`
**Mode**: `"use client"`

**Purpose**: Used in admin for schedule overrides and appointment filters. Extends DatePicker to support start + end date selection.

**Props**:
```ts
interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onRangeChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}
```

**Visual spec**: Range between start and end highlighted with `bg-primary/10`, start/end dates with `bg-primary text-white`.

### 2.6 TimeslotGrid

**File**: `src/components/booking/TimeslotGrid.tsx`
**Mode**: `"use client"` (selection state)

**Purpose**: Displays available time slots as a grid of pill buttons for public booking Step 3.

**Props**:
```ts
interface Timeslot {
  time: string;          // "09:00", "09:30", etc.
  available: boolean;
}

interface TimeslotGridProps {
  slots: Timeslot[];
  selectedTime?: string | null;
  onSelect: (time: string) => void;
  durationMinutes: number;        // shown below each slot
}
```

**Visual spec**:
- Grid: `grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3`
- Slot button (available): `px-4 py-3 rounded-xl bg-background-light text-primary font-semibold text-sm hover:bg-accent/30 transition-colors`
- Slot button (selected): `bg-primary text-white shadow-md`
- Slot button (unavailable): `bg-gray-100 text-gray-300 cursor-not-allowed line-through`
- Duration text below each slot: `text-xs text-gray-400 mt-1`
- Container entrance: `<motion.div>` with stagger children animation, each slot fading up

### 2.7 StepIndicator

**File**: `src/components/booking/StepIndicator.tsx`
**Mode**: `"use client"` (active step state drives visual)

**Purpose**: Horizontal progress indicator at the top of the multi-step booking flow.

**Props**:
```ts
interface StepIndicatorProps {
  steps: string[];           // ["Tipus", "Datum", "Idopont", "Adatok", "Visszaigazolas"]
  currentStep: number;       // 0-indexed
}
```

**Visual spec**:
- Container: `flex items-center justify-center gap-2 py-4`
- Each step: a circle + optional connecting line
- Completed step circle: `w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold` with a checkmark icon
- Current step circle: `w-8 h-8 rounded-full bg-accent text-primary flex items-center justify-center text-xs font-bold ring-4 ring-accent/30`
- Future step circle: `w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-medium`
- Connecting line: `flex-1 h-0.5 bg-gray-200` (completed: `bg-primary`)
- Step labels below circles (hidden on mobile `< sm`, shown on `sm+`): `text-xs font-medium text-gray-500 mt-1`

**Responsive behavior**:
- `< sm`: Circles only, no labels, slightly smaller (`w-6 h-6`)
- `>= sm`: Circles + labels

### 2.8 ConfirmDialog

**File**: `src/components/ui/ConfirmDialog.tsx`
**Mode**: `"use client"` (open/close state, focus trap)

**Purpose**: Modal confirmation dialog for destructive actions (cancel appointment, delete override, deactivate user).

**Props**:
```ts
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;         // default: "Megerosites"
  cancelLabel?: string;          // default: "Megsem"
  variant?: "danger" | "default"; // danger = red confirm button
  isLoading?: boolean;
}
```

**Visual spec**:
- Backdrop: `fixed inset-0 bg-black/40 backdrop-blur-sm z-50`
- Dialog card: `bg-white rounded-2xl p-6 max-w-sm mx-auto shadow-2xl`
- Title: `text-lg font-bold text-primary`
- Description: `text-sm text-gray-600 mt-2`
- Button row: `flex gap-3 mt-6 justify-end`
- Cancel button: `px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors`
- Confirm button (default): `px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors`
- Confirm button (danger): `px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors`
- Motion: `<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>`
- Accessibility: Focus trap within dialog, `role="alertdialog"`, `aria-modal="true"`, ESC key closes

### 2.9 Toast / Notification System

**File**: `src/components/ui/Toast.tsx`
**Mode**: `"use client"` (auto-dismiss timer, animation state)

**Purpose**: Non-blocking notification toasts for action confirmations (save success, error messages).

**Variants**:
- `success`: Green left border, checkmark icon -- `"Sikeresen mentve"`, `"Idopont letrehozva"`
- `error`: Red left border, X icon -- `"Hiba tortent"`, `"Nem sikerult menteni"`
- `info`: Blue left border, info icon -- `"Valtozasok mentesre varnak"`
- `warning`: Yellow left border, warning icon -- `"A lemondasi hatarido kozeledik"`

**Visual spec**:
- Position: `fixed bottom-6 right-6 z-50`
- Toast card: `bg-white rounded-xl shadow-lg border-l-4 p-4 min-w-[320px] max-w-md`
- Auto-dismiss: 5 seconds (configurable), with progress bar at bottom
- Stacked: Multiple toasts stack vertically with `gap-3`
- Motion: slide in from right, slide out to right

**State management**: Use a simple React context provider (`ToastProvider`) with `useToast()` hook:
```ts
const { toast } = useToast();
toast({ variant: "success", title: "Sikeresen mentve" });
```

### 2.10 FormField

**File**: `src/components/ui/FormField.tsx`
**Mode**: Server Component (static wrapper), but form inputs inside are client

**Purpose**: Consistent form field wrapper with label, input, and error message.

**Props**:
```ts
interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;     // the actual <input>, <select>, <textarea>
}
```

**Visual spec**:
- Label: `text-sm font-semibold text-gray-700 mb-1.5` (with red `*` if required)
- Input styling (applied to children via className convention): `w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors`
- Error message: `text-xs text-red-600 mt-1 font-medium`
- Error state on input: `border-red-400 focus:ring-red-300`

### 2.11 EmptyState

**File**: `src/components/admin/EmptyState.tsx`
**Mode**: Server Component

**Purpose**: Displayed when a list/table has no data.

**Props**:
```ts
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}
```

**Visual spec**:
- Container: `flex flex-col items-center justify-center py-16 text-center`
- Icon: `w-12 h-12 text-gray-300 mb-4`
- Title: `text-lg font-bold text-gray-500`
- Description: `text-sm text-gray-400 mt-1`
- Action button: `mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold`

### 2.12 Skeleton Loaders

**File**: `src/components/ui/Skeleton.tsx`
**Mode**: Server Component

**Purpose**: Placeholder UI during loading states.

**Variants**:
```ts
function SkeletonCard()   // rounded-2xl, h-[200px], pulsing gray
function SkeletonRow()    // h-12, full width, pulsing gray (for table rows)
function SkeletonText()   // h-4, w-3/4, pulsing gray
function SkeletonCircle() // w-10 h-10, rounded-full, pulsing gray
```

**Base class**: `animate-pulse bg-gray-200 rounded-xl`

---

## 3. Admin Panel

All admin pages are under `/admin/*`, protected by NextAuth middleware. Admin pages use a separate layout (`src/app/admin/layout.tsx`) that wraps children in `<AdminLayout>` and does NOT render the public Header/Footer.

### Admin Route Group Layout

**File**: `src/app/admin/layout.tsx`
**Mode**: Server Component (fetches session, passes user data)

```
src/app/admin/
  layout.tsx              -- AdminLayout wrapper, session check
  page.tsx                -- Dashboard
  login/page.tsx          -- Login (outside AdminLayout, no sidebar)
  appointments/
    page.tsx              -- Appointments list
    [id]/page.tsx         -- Appointment detail
  patients/
    page.tsx              -- Patients list
    [id]/page.tsx         -- Patient detail
  schedule/page.tsx       -- Weekly schedule editor
  appointment-types/page.tsx -- Appointment type manager
  messages/page.tsx       -- Message template editor
  waitlist/page.tsx       -- Waitlist manager
  settings/page.tsx       -- Clinic settings
  users/page.tsx          -- User management (admin only)
```

### Admin Middleware

**File**: `src/middleware.ts`

Protects all `/admin/*` routes except `/admin/login`. Redirects unauthenticated users to `/admin/login`. Checks session token via NextAuth.

---

### 3.1 /admin/login

**Route**: `/admin/login`
**Mode**: Page is Server Component; form is `"use client"`
**Layout**: Does NOT use AdminLayout -- standalone page with no sidebar

#### Component Tree
```
LoginPage (server)
  +-- LoginForm (client)
        +-- Logo (Morocz Medical logo, centered)
        +-- FormField "Email cim" (email input)
        +-- FormField "Jelszo" (password input, type="password")
        +-- ErrorMessage (conditional)
        +-- SubmitButton "Bejelentkezes"
```

#### Data Requirements
- **Action**: `loginAction(formData: FormData)` -- Next.js Server Action
  - Validates email + password against `admin_users` table
  - Checks `is_active === true`
  - Compares password hash (bcrypt)
  - Creates NextAuth session on success
  - Returns `{ error?: string }` on failure

#### Key UI Elements

**Background**: Full viewport, `bg-primary` (dark navy). Centered login card.

**Login card**:
- `bg-white rounded-3xl p-8 sm:p-10 w-full max-w-sm shadow-2xl mx-auto`
- Logo at top center: `mm-logo-web.svg`, `h-10 w-auto mb-8`
- No "registration" link -- admin accounts are created by existing admins

**Form fields**:
- Email: `<input type="email" placeholder="email@example.com" autocomplete="email">`
- Password: `<input type="password" placeholder="********" autocomplete="current-password">`
- Submit: Full-width button, `bg-primary text-white rounded-xl py-3 font-bold text-sm hover:bg-primary/90`

**Error state**:
- Appears above submit button
- `bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium`
- Text: `"Hibas email vagy jelszo"`

**Loading state**:
- Submit button shows spinner icon, text changes to `"Bejelentkezes..."`, button disabled with `opacity-70`

**Success behavior**:
- Redirect to `/admin` via `redirect("/admin")` in Server Action

#### Responsive Behavior
- Card stays centered at all sizes via `flex items-center justify-center min-h-screen`
- On very small screens (`< 360px`): Card has `mx-4` margin, `p-6` instead of `p-10`

#### Accessibility
- `<form>` element with `aria-label="Bejelentkezesi urlap"`
- Input fields have proper `<label>` associations via `htmlFor`
- Error message linked to form via `aria-describedby`
- Autofocus on email field

---

### 3.2 /admin (Dashboard)

**Route**: `/admin`
**Mode**: Page is Server Component (fetches today's data); timeline component is `"use client"`
**Layout**: AdminLayout with `pageTitle="Vezerlopult"`

#### Component Tree
```
DashboardPage (server)
  +-- StatsCardRow
  |     +-- StatCard "Mai idopontok" (count, icon: Calendar)
  |     +-- StatCard "Varakozok" (waitlist count, icon: Clock)
  |     +-- StatCard "Heti osszesites" (completed this week, icon: CheckCircle)
  +-- TodayTimeline (client)
  |     +-- TimelineEntry (per appointment, time-ordered)
  |           +-- Time label
  |           +-- Color bar (appointment type color)
  |           +-- Patient name
  |           +-- Appointment type
  |           +-- StatusBadge
  +-- QuickActions
        +-- ActionButton "Uj idopont" → /admin/appointments?new=true
        +-- ActionButton "Betegek" → /admin/patients
        +-- ActionButton "Beallitasok" → /admin/settings
```

#### Data Requirements
- **Server fetch** (parallel `Promise.all`):
  1. `getTodayAppointmentCount()` -- `SELECT COUNT(*) FROM appointments WHERE DATE(start_time AT TIME ZONE 'Europe/Budapest') = CURRENT_DATE AND status != 'cancelled'`
  2. `getWaitlistCount()` -- `SELECT COUNT(*) FROM waitlist_entries WHERE status = 'waiting'`
  3. `getWeeklyCompletedCount()` -- `SELECT COUNT(*) FROM appointments WHERE status = 'completed' AND start_time >= (current week start)`
  4. `getTodayAppointments()` -- `SELECT appointments.*, patients.first_name, patients.last_name, appointment_types.name, appointment_types.color FROM appointments JOIN patients JOIN appointment_types WHERE DATE(start_time AT TIME ZONE 'Europe/Budapest') = CURRENT_DATE ORDER BY start_time ASC`

#### Key UI Elements

**Stats cards row**:
- Grid: `grid grid-cols-1 sm:grid-cols-3 gap-4`
- Each card: `bg-white rounded-2xl p-6 flex items-center gap-4`
- Icon circle: `w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center`
- Count: `text-3xl font-extrabold text-primary`
- Label: `text-sm font-medium text-gray-500`

**Today's timeline**:
- Container: `bg-white rounded-2xl p-6`
- Section title: `text-lg font-bold text-primary mb-4` -- `"Mai idopontok"`
- Each entry is a horizontal row: `flex items-center gap-4 py-3 border-b border-gray-50 last:border-0`
  - Time: `text-sm font-bold text-gray-500 w-14 shrink-0` (e.g., `"09:00"`)
  - Color bar: `w-1 h-10 rounded-full` with inline `style={{ backgroundColor: appointmentType.color }}`
  - Patient name: `text-sm font-semibold text-primary`
  - Type: `text-sm text-gray-500`
  - StatusBadge: right-aligned
  - Click row: navigates to `/admin/appointments/[id]`

**Empty timeline**: If no appointments today, show `EmptyState` with title `"Ma nincsenek idopontok"`, icon: calendar with checkmark.

**Quick action buttons**:
- Row: `flex flex-wrap gap-3 mt-6`
- Each: `inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors`

#### Loading State
- Stats cards: 3 x `SkeletonCard` in the grid
- Timeline: 5 x `SkeletonRow`

#### Responsive Behavior
- Stats cards: stack to single column on mobile (`grid-cols-1`), 3-column on `sm+`
- Timeline entries: horizontal row at all sizes; patient name truncated with `truncate` class on small screens
- Quick actions: wrap naturally

---

### 3.3 /admin/appointments

**Route**: `/admin/appointments`
**Mode**: Page is Server Component (initial data fetch); view toggle, calendar, and filters are `"use client"`
**Layout**: AdminLayout with `pageTitle="Idopontok"`

#### Component Tree
```
AppointmentsPage (server -- fetches initial data + searchParams)
  +-- AppointmentsView (client)
        +-- ViewToggle: "Naptar nezet" / "Lista nezet"
        +-- FilterBar
        |     +-- DateRangePicker
        |     +-- Select "Statusz" (Osszes, Visszaigazolva, Lemondva, Teljesitve, Nem jelent meg)
        |     +-- Select "Tipus" (Osszes, Varandosgondozas, Nogyogyaszat, ...)
        +-- [CalendarView] (if calendar mode)
        |     +-- WeekNavigation (Elozo het / Ma / Kovetkezo het)
        |     +-- WeekGrid
        |           +-- DayColumn (per day, Mon-Sat)
        |                 +-- AppointmentBlock (colored, positioned by time)
        +-- [ListView] (if list mode)
              +-- DataTable
                    columns: Datum, Ido, Beteg, Tipus, Statusz, Muveletek
```

#### Data Requirements
- **Server fetch** (initial page load, reads `searchParams` for filters):
  - `getAppointments({ dateFrom, dateTo, status, typeId, page, pageSize, sortBy, sortDir })`
  - Returns `{ data: Appointment[], totalCount: number }`
  - Joins: `patients` (name), `appointment_types` (name, color)
- **Client-side**: Filter changes trigger URL `searchParams` updates via `useRouter().push()` to trigger new server fetch (Next.js pattern)
- For calendar view: fetch full week of appointments (Mon-Sat of selected week)

#### Key UI Elements

**View toggle**:
- `inline-flex rounded-xl bg-background-light p-1` wrapping two buttons
- Active button: `bg-white shadow-sm rounded-lg px-4 py-2 text-sm font-bold text-primary`
- Inactive button: `px-4 py-2 text-sm font-medium text-gray-500 hover:text-primary`

**Filter bar**:
- Row: `flex flex-wrap items-center gap-3 mb-6`
- Select dropdowns: `px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary/30`
  - Status options: `Osszes statusz`, `Visszaigazolva`, `Lemondva`, `Teljesitve`, `Nem jelent meg`
  - Type options: `Osszes tipus`, then all active appointment types from DB

**Calendar view (week)**:
- Week navigation bar: Previous/Next arrows + "Ma" (Today) button + week date range display (`"2026. feb. 16. -- feb. 21."`)
- Grid: 6 columns (Hetfo--Szombat), vertical time axis (08:00--18:00, configurable from `weekly_schedule`)
- Day column header: `text-xs font-bold text-gray-500 uppercase` with day name + date
- Time axis (left): `text-xs text-gray-400` at each hour mark
- Appointment blocks: Absolutely positioned based on `startTime` and `endTime`
  - Width: fill column
  - Background: appointment type `color` at 20% opacity, left border 3px solid at full color
  - Inner text: `text-xs font-semibold` patient name, appointment type name
  - Click: navigate to `/admin/appointments/[id]`
  - Current time indicator: horizontal red line across all columns

**List view**:
- Uses `DataTable` component with columns:
  | Column | Key | Sortable | Renderer |
  |--------|-----|----------|----------|
  | Datum | startTime | Yes | `format(startTime, "yyyy. MMM dd.", { locale: hu })` |
  | Ido | startTime | Yes | `format(startTime, "HH:mm")` |
  | Beteg | patient.lastName + firstName | Yes | Full name as link |
  | Tipus | appointmentType.name | Yes | Plain text |
  | Statusz | status | Yes | `<StatusBadge>` |
  | Muveletek | -- | No | "Reszletek" link button |

- Page size: 20
- Server-side pagination

#### Loading State
- Calendar: Skeleton grid with pulsing blocks
- List: DataTable skeleton rows

#### Error State
- If fetch fails: `EmptyState` with error icon, title `"Nem sikerult betolteni az idopontokat"`, description `"Kerjuk, probald ujra kesobb."`, action button: `"Ujraproba"`

#### Responsive Behavior
- `< md`: Calendar view is hidden; only list view available (toggle hides calendar option)
- `>= md`: Both views available
- Filter bar: wraps onto multiple lines on small screens
- Calendar view: minimum width enforced, horizontal scroll on tablets

---

### 3.4 /admin/appointments/[id]

**Route**: `/admin/appointments/[id]`
**Mode**: Page is Server Component; status dropdown, notes, and actions are `"use client"`
**Layout**: AdminLayout with `pageTitle="Idopont reszletek"`

#### Component Tree
```
AppointmentDetailPage (server -- fetches appointment by ID)
  +-- BackLink "Vissza az idopontokhoz" → /admin/appointments
  +-- TwoColumnGrid
        +-- Left column
        |     +-- AppointmentDetailsCard
        |     |     +-- Type name + color indicator
        |     |     +-- Date: "2026. februar 25., szerda"
        |     |     +-- Time: "14:00 -- 14:30"
        |     |     +-- Duration: "30 perc"
        |     |     +-- StatusBadge (current)
        |     |     +-- StatusChangeDropdown (client)
        |     |     +-- GoogleCalendarLink (if googleEventId exists)
        |     +-- NotesSection (client)
        |           +-- <textarea> with current notes
        |           +-- "Mentes" button (or auto-save with debounce)
        +-- Right column
              +-- PatientInfoCard
              |     +-- Patient name (linked to /admin/patients/[patientId])
              |     +-- Email (mailto link)
              |     +-- Phone (tel link)
              +-- StatusHistoryCard
                    +-- Timeline of status changes (from notification_log)
                    +-- Each entry: timestamp, event description, status badge
```

#### Data Requirements
- **Server fetch**: `getAppointmentById(id)` -- joins `patients`, `appointment_types`, plus related `notification_log` entries
- **Server Actions**:
  - `updateAppointmentStatus(id, newStatus)` -- updates status, creates notification_log entry, triggers email if template exists
  - `updateAppointmentNotes(id, notes)` -- updates notes field

#### Key UI Elements

**Back link**: `flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary mb-6` with left arrow icon

**Appointment details card**:
- `bg-white rounded-2xl p-6`
- Type with color dot: `flex items-center gap-2` -- `<span className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />` + `text-lg font-bold text-primary`
- Date/time/duration: Each on its own line, `text-sm text-gray-600` with icon prefix (calendar, clock, hourglass)
- Status change: `<select>` dropdown styled as a pill, options are all appointment statuses
  - Change triggers `ConfirmDialog`: `"Biztosan megvaltoztatja az idopont statuszat? Ez ertesitest kuldhet a betegnek."`

**Google Calendar link**:
- If `googleEventId` exists: `"Megnyitas a Google Naptarban"` external link with icon
- If not: `"Nincs Google Naptar kapcsolat"` in gray italic

**Notes section**:
- `<textarea className="w-full p-4 rounded-xl border border-gray-200 text-sm min-h-[120px] resize-y focus:ring-2 focus:ring-primary/30 focus:border-primary">`
- Placeholder: `"Megjegyzes hozzaadasa..."`
- Save button: `bg-primary text-white rounded-xl px-4 py-2 text-sm font-bold`
- Success toast on save: `"Megjegyzes mentve"`

**Patient info card**:
- `bg-white rounded-2xl p-6`
- Header: `text-base font-bold text-primary mb-3` -- `"Beteg adatai"`
- Name as link: `text-accent hover:underline font-semibold`
- Email and phone with copy-to-clipboard icons

**Status history card**:
- `bg-white rounded-2xl p-6`
- Header: `"Idopont tortenete"`
- Vertical timeline with dots and connecting lines
- Each entry: `text-xs text-gray-400` timestamp + `text-sm text-gray-700` description

#### Loading State
- Full page skeleton: two-column layout with skeleton cards

#### Error State
- If appointment not found: `EmptyState` with title `"Az idopont nem talalhato"`, action `"Vissza az idopontokhoz"`

#### Responsive Behavior
- `< md`: Single column, cards stack vertically
- `>= md`: Two-column grid (`grid grid-cols-1 md:grid-cols-3`), left column `col-span-2`, right column `col-span-1`

---

### 3.5 /admin/patients

**Route**: `/admin/patients`
**Mode**: Page is Server Component; search and DataTable are `"use client"`
**Layout**: AdminLayout with `pageTitle="Betegek"`

#### Component Tree
```
PatientsPage (server -- fetches initial page of patients)
  +-- SearchBar (client)
  |     +-- <input type="search" placeholder="Beteg keresese...">
  |     +-- Search icon
  +-- DataTable (client)
        columns: Nev, Email, Telefon, Utolso idopont, Osszesen
```

#### Data Requirements
- **Server fetch**: `getPatients({ search, page, pageSize, sortBy, sortDir })`
  - `search` matches against `first_name`, `last_name`, `email`, `phone` using `ILIKE '%term%'`
  - Returns `{ data: Patient[], totalCount: number }`
  - Includes computed fields: `lastAppointmentDate` (MAX startTime from appointments), `totalAppointments` (COUNT)
  - Server-side pagination: 20 per page
  - **Performance**: 2,300+ patients -- search must use DB-level `ILIKE` with index, not client-side filtering

#### Key UI Elements

**Search bar**:
- `relative w-full max-w-md mb-6`
- Input: `w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary/30`
- Search icon: `absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`
- Debounced input (300ms) updates URL `searchParams` to trigger server refetch
- Clear button (X icon) appears when search has value

**DataTable columns**:
| Column | Key | Sortable | Renderer |
|--------|-----|----------|----------|
| Nev | lastName, firstName | Yes | `lastName + " " + firstName` |
| Email | email | Yes | `<a href="mailto:...">` with truncate |
| Telefon | phone | No | Formatted phone or `"--"` |
| Utolso idopont | lastAppointmentDate | Yes | Formatted date or `"Nincs"` |
| Osszesen | totalAppointments | Yes | Number |

- Row click: navigate to `/admin/patients/[id]`

**Pagination info**: `"1-20 / 2 320 beteg"` -- displays total count with `toLocaleString("hu-HU")`

#### Loading State
- Search: No loading indicator on search input (debounced, fast)
- Table: Skeleton rows while page loads

#### Empty State
- No search results: `"Nincs talalat a(z) '{search}' keresesi feltetelek alapjan"`
- No patients at all: `"Meg nincsenek betegek a rendszerben"`

#### Responsive Behavior
- Search bar: full width on mobile
- Table: horizontal scroll on mobile; `Telefon` and `Utolso idopont` columns hidden below `md`

---

### 3.6 /admin/patients/[id]

**Route**: `/admin/patients/[id]`
**Mode**: Page is Server Component; edit form and appointment list are `"use client"`
**Layout**: AdminLayout with `pageTitle="Beteg profil"`

#### Component Tree
```
PatientDetailPage (server)
  +-- BackLink "Vissza a betegekhez" → /admin/patients
  +-- PatientHeader
  |     +-- Name (large heading)
  |     +-- Email, Phone, Date of birth
  |     +-- EditButton "Szerkesztes" (toggles edit mode)
  +-- PatientEditForm (client, shown when edit mode active)
  |     +-- FormField "Vezeteknev"
  |     +-- FormField "Keresztnev"
  |     +-- FormField "Email"
  |     +-- FormField "Telefonszam"
  |     +-- FormField "Szuletesi datum" (date input)
  |     +-- FormField "Belsoszam megjegyzes" (textarea)
  |     +-- "Mentes" button + "Megsem" button
  +-- AppointmentHistorySection
  |     +-- Section heading "Idopont elozmenyei"
  |     +-- DataTable: Datum, Tipus, Statusz, Megjegyzes
  +-- ActionRow
        +-- "Uj idopont letrehozasa" button
```

#### Data Requirements
- **Server fetch**: `getPatientById(id)` + `getPatientAppointments(patientId, { page, pageSize })`
- **Server Action**: `updatePatient(id, data)` -- validates with Zod, updates patient record

#### Key UI Elements

**Patient header**:
- `bg-white rounded-2xl p-6`
- Name: `text-2xl font-extrabold text-primary`
- Contact info: `text-sm text-gray-600` rows with icons
- Edit button: `px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50`

**Edit form** (inline, replaces the header content when active):
- Same card, fields replace display text
- Uses `FormField` components
- Zod validation schema:
  ```ts
  const patientSchema = z.object({
    firstName: z.string().min(1, "A keresztnev megadasa kotelezo"),
    lastName: z.string().min(1, "A vezeteknev megadasa kotelezo"),
    email: z.string().email("Ervenytelen email cim"),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    notes: z.string().optional(),
  });
  ```

**Appointment history table**:
| Column | Renderer |
|--------|----------|
| Datum | Formatted date + time |
| Tipus | Appointment type name |
| Statusz | `<StatusBadge>` |
| Megjegyzes | Truncated notes, expandable |

- Page size: 10
- Click row: navigate to `/admin/appointments/[id]`

**"Uj idopont letrehozasa" button**: Links to admin appointment creation flow (future scope -- for now, bookings come from public page).

#### Responsive Behavior
- Patient header and edit form: single column, full width
- Appointment history table: horizontal scroll on mobile

---

### 3.7 /admin/schedule

**Route**: `/admin/schedule`
**Mode**: Page is Server Component; grid and override forms are `"use client"`
**Layout**: AdminLayout with `pageTitle="Idobeosztas"`

#### Component Tree
```
SchedulePage (server)
  +-- WeeklyScheduleEditor (client)
  |     +-- SectionHeading "Heti beosztás"
  |     +-- ScheduleRow (per day, Mon-Sat)
  |     |     +-- DayLabel ("Hetfo", "Kedd", ...)
  |     |     +-- TimeInput "Kezdes" (start time)
  |     |     +-- TimeInput "Befejezes" (end time)
  |     |     +-- ActiveToggle (switch)
  |     +-- SaveButton "Mentes"
  +-- AppointmentTypeDurations (server)
  |     +-- SectionHeading "Vizsgalat tipusok idotartamai"
  |     +-- Per-type row: name, duration in minutes
  +-- ScheduleOverridesSection (client)
        +-- SectionHeading "Kiveteles napok"
        +-- OverridesTable
        |     +-- DataTable: Idoszak, Zarva?, Idopont, Ok, Muveletek
        +-- AddOverrideForm
              +-- DateRangePicker
              +-- Checkbox "Egesz nap zarva"
              +-- TimeInput "Kezdes" (if not closed)
              +-- TimeInput "Befejezes" (if not closed)
              +-- TextInput "Ok" (reason)
              +-- "Hozzaadas" button
```

#### Data Requirements
- **Server fetch**:
  - `getWeeklySchedule()` -- all rows from `weekly_schedule` table
  - `getAppointmentTypes()` -- all active types (for duration display)
  - `getScheduleOverrides()` -- all overrides, ordered by `start_date DESC`
- **Server Actions**:
  - `updateWeeklySchedule(rows)` -- bulk upsert all 6 day rows
  - `createScheduleOverride(data)` -- insert new override
  - `deleteScheduleOverride(id)` -- delete override

#### Key UI Elements

**Weekly schedule grid**:
- Container: `bg-white rounded-2xl p-6`
- Each day row: `flex items-center gap-4 py-3 border-b border-gray-50`
- Day label: `w-24 text-sm font-bold text-primary`
  - Days: `"Hetfo"`, `"Kedd"`, `"Szerda"`, `"Csutortok"`, `"Pentek"`, `"Szombat"`
- Time inputs: `<input type="time">` styled with `px-3 py-2 rounded-xl border border-gray-200 text-sm w-28`
- Active toggle: Custom switch component
  - Active: `bg-accent` track, white circle
  - Inactive: `bg-gray-200` track, white circle
  - Label: `"Aktiv"` / `"Inaktiv"` next to switch

**Appointment type durations**:
- Container: `bg-white rounded-2xl p-6 mt-4`
- Read-only display: `flex items-center justify-between py-2`
- Type name + colored dot, duration text: `"30 perc"`, `"45 perc"`
- Link to `/admin/appointment-types` for editing

**Schedule overrides table**:
- Container: `bg-white rounded-2xl p-6 mt-4`
- Table columns:
  | Column | Renderer |
  |--------|----------|
  | Idoszak | `"2026. feb. 25. -- feb. 28."` or single date |
  | Zarva? | `"Igen"` (red badge) or `"Nem"` |
  | Idopont | `"09:00 -- 14:00"` or `"--"` if closed |
  | Ok | Reason text or `"--"` |
  | Muveletek | Delete button (trash icon) |

- Delete triggers `ConfirmDialog`: `"Biztosan torli ezt a kivetelt?"`
- Visual indicator for upcoming overrides (within next 14 days): yellow dot or highlight

**Add override form**:
- Collapsible section: `"+ Uj kivitel hozzaadasa"` button expands form below the table
- `bg-background-light rounded-2xl p-6` when expanded
- Closed checkbox: When checked, hides time inputs
- Reason field: `<input type="text" placeholder="pl. Karacsony, Szabadsag">`
- Submit button: `"Hozzaadas"` -- `bg-primary text-white rounded-xl px-4 py-2`

#### Loading State
- Skeleton for weekly grid (6 rows)
- Skeleton for overrides table

#### Responsive Behavior
- `< md`: Weekly schedule rows stack -- day label on top, time inputs and toggle below
- `>= md`: Horizontal row layout
- Override form: fields stack vertically on mobile

---

### 3.8 /admin/appointment-types

**Route**: `/admin/appointment-types`
**Mode**: Page is Server Component; cards and forms are `"use client"`
**Layout**: AdminLayout with `pageTitle="Vizsgalat tipusok"`

#### Component Tree
```
AppointmentTypesPage (server)
  +-- AppointmentTypesList (client)
        +-- AppointmentTypeCard (per type)
        |     +-- Color swatch
        |     +-- Name
        |     +-- Slug
        |     +-- Duration ("30 perc")
        |     +-- ActiveToggle
        |     +-- EditButton (pencil icon)
        |     +-- ReorderButtons (up/down arrows)
        +-- AddTypeButton "Uj tipus hozzaadasa"
        +-- EditTypeModal (shown when editing)
              +-- FormField "Nev"
              +-- FormField "Slug" (auto-generated from name, editable)
              +-- FormField "Idotartam (perc)" (number input)
              +-- ColorPicker (preset swatches)
              +-- "Mentes" / "Megsem" buttons
```

#### Data Requirements
- **Server fetch**: `getAppointmentTypes()` -- all types ordered by `sort_order`
- **Server Actions**:
  - `createAppointmentType(data)` -- insert new type
  - `updateAppointmentType(id, data)` -- update existing type
  - `reorderAppointmentTypes(orderedIds)` -- bulk update `sort_order`

#### Key UI Elements

**Type cards**:
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Each card: `bg-white rounded-2xl p-6 border border-gray-100`
- Color swatch: `w-6 h-6 rounded-full` with inline background color
- Name: `text-lg font-bold text-primary`
- Slug: `text-xs text-gray-400 font-mono`
- Duration: `text-sm text-gray-600`
- Active toggle: Same switch component as schedule
- Reorder: up/down arrow buttons, `text-gray-400 hover:text-primary`

**Edit modal**:
- Uses `ConfirmDialog`-style modal backdrop
- Form card: `bg-white rounded-2xl p-6 max-w-md mx-auto shadow-2xl`
- Color picker: Row of 8 preset color swatches (`#3B82F6`, `#10B981`, `#F59E0B`, `#EF4444`, `#8B5CF6`, `#EC4899`, `#06B6D4`, `#F97316`), click to select
- Selected color: `ring-2 ring-offset-2 ring-primary`
- Zod validation:
  ```ts
  const typeSchema = z.object({
    name: z.string().min(1, "A nev megadasa kotelezo"),
    slug: z.string().min(1, "A slug megadasa kotelezo").regex(/^[a-z0-9-]+$/, "Csak kisbetuk, szamok es kotojel"),
    durationMinutes: z.number().min(5, "Minimum 5 perc").max(240, "Maximum 240 perc"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ervenytelen szinkod"),
  });
  ```

**Add button**: `bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold` with plus icon

#### Responsive Behavior
- Cards: 1 column mobile, 2 on `sm`, 3 on `lg`
- Modal: Full-width on mobile with bottom sheet style, centered on desktop

---

### 3.9 /admin/messages

**Route**: `/admin/messages`
**Mode**: Page is Server Component; template editor is `"use client"`
**Layout**: AdminLayout with `pageTitle="Uzenet sablonok"`

#### Component Tree
```
MessagesPage (server)
  +-- MessageTemplateEditor (client)
        +-- TemplateList (left sidebar)
        |     +-- TemplateItem (per event type)
        |           +-- Event name
        |           +-- RecipientBadge (Beteg / Orvos / Mindketto)
        |           +-- Active indicator dot
        +-- TemplateEditPanel (right panel, shown when template selected)
        |     +-- RecipientTypeSelect
        |     +-- FormField "Targy" (subject)
        |     +-- FormField "Szovegtorzs" (body textarea)
        |     +-- VariableInsertionBar
        |     |     +-- VariableButton "$patient_name"
        |     |     +-- VariableButton "$appointment_date"
        |     |     +-- VariableButton "$appointment_time"
        |     |     +-- VariableButton "$appointment_type"
        |     |     +-- VariableButton "$cancel_url"
        |     |     +-- VariableButton "$doctor_name"
        |     |     +-- VariableButton "$clinic_name"
        |     |     +-- VariableButton "$clinic_phone"
        |     +-- SaveButton "Mentes"
        +-- TemplatePreview (bottom panel)
              +-- SectionHeading "Elonezet"
              +-- Rendered subject with sample data
              +-- Rendered body with sample data
```

#### Data Requirements
- **Server fetch**: `getMessageTemplates()` -- all templates
- **Server Action**: `updateMessageTemplate(id, data)` -- update subject, body, recipientType

#### Key UI Elements

**Template list (sidebar)**:
- Width: `w-72` on desktop, full width on mobile (switches to top tabs)
- Background: `bg-white rounded-2xl`
- Each item: `px-4 py-3 cursor-pointer hover:bg-background-light transition-colors`
- Event names (Hungarian):
  - `booking_confirmed` → `"Idopont letrehozva"`
  - `reminder_24h` → `"Emlekeztetett (24 ora)"`
  - `booking_cancelled` (by patient) → `"Lemondva (beteg altal)"`
  - `booking_cancelled` (by doctor) → `"Lemondva (orvos altal)"`
  - `appointment_completed` → `"Teljesitve"`
  - `waitlist_slot_available` → `"Felszabadult idopont"`
  - `no_show` → `"Nem jelent meg"`
- Active/selected: `bg-primary/5 border-l-3 border-primary font-bold`

**Recipient type**:
- Display badges: `Beteg` (green), `Orvos` (blue), `Mindketto` (purple)

**Variable insertion bar**:
- Row of small pill buttons: `px-2 py-1 rounded-md bg-background-light text-xs font-mono text-gray-600 hover:bg-accent/20 cursor-pointer`
- Click inserts variable at cursor position in the body textarea
- Variables with Hungarian labels:
  - `$patient_name` → tooltip: `"Beteg neve"`
  - `$appointment_date` → tooltip: `"Idopont datuma"`
  - `$appointment_time` → tooltip: `"Idopont ideje"`
  - `$appointment_type` → tooltip: `"Vizsgalat tipusa"`
  - `$cancel_url` → tooltip: `"Lemondasi link"`
  - `$doctor_name` → tooltip: `"Orvos neve"`
  - `$clinic_name` → tooltip: `"Rendelo neve"`
  - `$clinic_phone` → tooltip: `"Rendelo telefonszama"`

**Preview panel**:
- `bg-background-light rounded-2xl p-6 mt-4`
- Sample data used for preview:
  ```ts
  const sampleData = {
    $patient_name: "Kovacs Anna",
    $appointment_date: "2026. februar 25.",
    $appointment_time: "14:00",
    $appointment_type: "Nogyogyaszati vizsgalat",
    $cancel_url: "https://moroczmedical.hu/cancel/abc123",
    $doctor_name: "Dr. Morocz Angela",
    $clinic_name: "Dr. Morocz Angela Nogyogyaszat",
    $clinic_phone: "+36 70 639 5239",
  };
  ```
- Subject preview: `text-base font-bold text-primary`
- Body preview: `text-sm text-gray-700 whitespace-pre-wrap`
- Variables in preview replaced with sample values, highlighted with `bg-accent/20 px-1 rounded`

#### Responsive Behavior
- `< md`: Sidebar becomes horizontal scrollable tab bar at the top
- `>= md`: Side-by-side layout with `grid grid-cols-[272px_1fr]`
- Preview panel: always below the editor

---

### 3.10 /admin/waitlist

**Route**: `/admin/waitlist`
**Mode**: Page is Server Component; table actions are `"use client"`
**Layout**: AdminLayout with `pageTitle="Varakozok"`

#### Component Tree
```
WaitlistPage (server)
  +-- FilterBar
  |     +-- StatusFilter: Osszes, Varakozik, Ertesitve, Foglalt, Lejart
  |     +-- BulkDeleteButton "Lejart bejegyzesek torlese"
  +-- DataTable
        columns: Nev, Email, Telefon, Tipus, Preferencia, Statusz, Datum, Muveletek
```

#### Data Requirements
- **Server fetch**: `getWaitlistEntries({ status, page, pageSize })` -- with joins to `appointment_types`
- **Server Actions**:
  - `notifyWaitlistEntry(id)` -- manually triggers "slot available" email
  - `bulkDeleteExpired()` -- deletes all entries with `status = 'expired'`

#### Key UI Elements

**DataTable columns**:
| Column | Renderer |
|--------|----------|
| Nev | `patient_name` |
| Email | `patient_email` with mailto link |
| Telefon | `patient_phone` or `"--"` |
| Tipus | Appointment type name or `"Barmely"` |
| Preferencia | Formatted: day name + time range, or `"Barmikor"` |
| Statusz | `<StatusBadge>` (waitlist variant) |
| Datum | `createdAt` formatted |
| Muveletek | `"Ertesites kuldese"` button (only if status = `"waiting"`) |

**"Ertesites kuldese" button**:
- Small pill button: `px-3 py-1.5 rounded-lg bg-accent text-primary text-xs font-bold hover:bg-accent/80`
- Click triggers `ConfirmDialog`: `"Ertesitesi emailt kuld ${name} cimere?"`
- After sending: StatusBadge changes to `"Ertesitve"`, toast: `"Ertesites sikeresen elkuldve"`

**Bulk delete**:
- Button: `text-sm text-red-600 hover:text-red-700 font-semibold` with trash icon
- Click triggers `ConfirmDialog`: `"Biztosan torli az osszes lejart bejegyzest? Ez a muvelet nem vonhato vissza."`
- variant: `"danger"`

#### Loading / Empty States
- Loading: Skeleton table rows
- Empty: `"Nincs varakozo a listaban"`

#### Responsive Behavior
- Table: horizontal scroll on mobile
- `Preferencia` and `Telefon` columns hidden below `lg`

---

### 3.11 /admin/settings

**Route**: `/admin/settings`
**Mode**: Page is Server Component; form is `"use client"`
**Layout**: AdminLayout with `pageTitle="Beallitasok"`

#### Component Tree
```
SettingsPage (server -- fetches doctor_settings)
  +-- SettingsForm (client)
        +-- Section "Rendelő adatok"
        |     +-- FormField "Rendelo neve" (clinicName)
        |     +-- FormField "Orvos neve" (doctorName)
        |     +-- FormField "Email" (doctorEmail)
        |     +-- FormField "Telefonszam" (phone)
        |     +-- FormField "Cim" (address)
        +-- Section "Google Naptar"
        |     +-- FormField "Google Calendar ID" (googleCalendarId)
        |     +-- ConnectionStatus indicator
        +-- Section "Idopont beallitasok"
        |     +-- FormField "Alapertelmezett idotartam (perc)" (defaultSlotDurationMinutes)
        |     +-- FormField "Lemondasi hatarido (ora)" (cancellationWindowHours)
        +-- SaveButton "Mentes"
```

#### Data Requirements
- **Server fetch**: `getDoctorSettings()` -- single row from `doctor_settings` (id=1)
- **Server Action**: `updateDoctorSettings(data)` -- validates + updates the singleton row

#### Key UI Elements

**Form sections**:
- Each section: `bg-white rounded-2xl p-6 mb-4`
- Section heading: `text-lg font-bold text-primary mb-4 pb-3 border-b border-gray-100`
- Fields: two-column grid on desktop (`grid grid-cols-1 md:grid-cols-2 gap-4`)

**Google Calendar connection status**:
- If `googleCalendarId` is set: Green dot + `"Kapcsolodva"` text
- If empty: Yellow dot + `"Nincs beallitva"` text
- Note: Actual Google Calendar OAuth is out of scope for the UI design; this field stores the calendar ID manually for now

**Save button**: Full-width on mobile, right-aligned on desktop. `bg-primary text-white rounded-xl px-6 py-3 font-bold text-sm`

**Success toast**: `"Beallitasok sikeresen mentve"`

**Validation** (Zod):
```ts
const settingsSchema = z.object({
  clinicName: z.string().min(1, "Kotelezo mezo"),
  doctorName: z.string().min(1, "Kotelezo mezo"),
  doctorEmail: z.string().email("Ervenytelen email cim"),
  phone: z.string().optional(),
  address: z.string().optional(),
  googleCalendarId: z.string().optional(),
  defaultSlotDurationMinutes: z.number().min(5).max(120),
  cancellationWindowHours: z.number().min(1).max(72),
});
```

#### Responsive Behavior
- Form fields: single column on mobile, two columns on `md+`
- Save button: full width on mobile, auto-width on desktop

---

### 3.12 /admin/users

**Route**: `/admin/users`
**Mode**: Page is Server Component; table and modal are `"use client"`
**Layout**: AdminLayout with `pageTitle="Felhasznalok"`
**Access**: Only visible/accessible to users with `role = "admin"`. Middleware redirects `receptionist` role to `/admin`.

#### Component Tree
```
UsersPage (server -- checks role, fetches users)
  +-- DataTable
  |     columns: Nev, Email, Szerepkor, Aktiv, Muveletek
  +-- AddUserButton "Uj felhasznalo"
  +-- AddUserModal (client)
        +-- FormField "Nev"
        +-- FormField "Email"
        +-- FormField "Jelszo" (password)
        +-- FormField "Jelszo ujra" (password confirm)
        +-- Select "Szerepkor" (Admin / Recepcios)
        +-- "Letrehozas" / "Megsem" buttons
```

#### Data Requirements
- **Server fetch**: `getAdminUsers()` -- all rows from `admin_users`
- **Server Actions**:
  - `createAdminUser(data)` -- insert with hashed password
  - `toggleAdminUserActive(id, isActive)` -- toggle `is_active`

#### Key UI Elements

**DataTable columns**:
| Column | Renderer |
|--------|----------|
| Nev | `name` |
| Email | `email` |
| Szerepkor | Badge: `"Admin"` (purple) or `"Recepcios"` (blue) |
| Aktiv | Toggle switch (green/gray) |
| Muveletek | Deactivate/Activate button |

**Role badges**:
- Admin: `bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-semibold`
- Recepcios: `bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold`

**Active toggle**: Same switch component. Triggers `ConfirmDialog` when deactivating: `"Biztosan deaktivalja ${name} fiokjat? A felhasznalo nem tud tobbe bejelentkezni."`

**Add user modal**:
- Password requirements displayed: `"Minimum 8 karakter"`
- Role select: `<select>` with options `"Admin"`, `"Recepcios"`
- Validation:
  ```ts
  const userSchema = z.object({
    name: z.string().min(1, "A nev megadasa kotelezo"),
    email: z.string().email("Ervenytelen email cim"),
    password: z.string().min(8, "Minimum 8 karakter"),
    passwordConfirm: z.string(),
    role: z.enum(["admin", "receptionist"]),
  }).refine(d => d.password === d.passwordConfirm, {
    message: "A ket jelszo nem egyezik",
    path: ["passwordConfirm"],
  });
  ```

#### Responsive Behavior
- Table: horizontal scroll on mobile
- Modal: full-width bottom sheet on mobile, centered dialog on desktop

---

## 4. Public Pages

Public pages use the existing root layout (`src/app/layout.tsx`) which includes the site Header and Footer. They share the same visual language as the marketing homepage.

---

### 4.1 /idopontfoglalas

**Route**: `/idopontfoglalas`
**Mode**: Page is Server Component (fetches appointment types + initial availability); multi-step flow is `"use client"`
**Layout**: Root layout (Header + Footer from marketing site)

#### File Structure
```
src/app/idopontfoglalas/
  page.tsx              -- Server Component, data fetching
  BookingWizard.tsx     -- "use client", main multi-step state machine
  steps/
    StepSelectType.tsx  -- Step 1
    StepSelectDate.tsx  -- Step 2
    StepSelectTime.tsx  -- Step 3
    StepPatientInfo.tsx -- Step 4
    StepConfirmation.tsx -- Step 5
```

#### Top-level Component Tree
```
BookingPage (server)
  +-- SectionWrapper (bg-white rounded-3xl p-6 md:p-10)
        +-- PageHeading "Idopontfoglalas"
        +-- StepIndicator (5 steps)
        +-- BookingWizard (client)
              +-- AnimatePresence mode="wait"
                    +-- [current step component]
```

#### State Management

The `BookingWizard` manages all booking state via `useState`:

```ts
interface BookingState {
  step: 1 | 2 | 3 | 4 | 5;
  appointmentTypeId?: number;
  appointmentTypeName?: string;
  appointmentTypeDuration?: number;
  selectedDate?: string;          // ISO date string "2026-02-25"
  selectedTime?: string;          // "14:00"
  patient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}
```

Step transitions use `<AnimatePresence mode="wait">` with slide animation:
- Forward: new step slides in from right (`x: 100 → 0`), old slides out left (`x: 0 → -100`)
- Backward: new step slides in from left (`x: -100 → 0`), old slides out right (`x: 0 → 100`)
- Duration: `0.3s`, ease: `easeInOut`

#### Step 1 -- Valasszon vizsgalat tipust

**Data requirements**: Appointment types fetched server-side, passed as props to `BookingWizard`.

**Component**: `StepSelectType`

**UI elements**:
- Heading: `text-2xl font-bold text-primary mb-6` -- `"Valasszon vizsgalat tipust"`
- Two large cards side by side:
  - Grid: `grid grid-cols-1 sm:grid-cols-2 gap-4`
  - Card for "Varandosgondozas":
    - Background: `bg-purple-card` (or from appointment type color)
    - `rounded-2xl p-8 cursor-pointer hover:shadow-xl transition-all duration-500`
    - Icon/emoji area: large decorative element (stethoscope or pregnancy icon)
    - Title: `text-xl font-extrabold text-primary`
    - Duration: `text-sm font-medium text-gray-600 mt-2` -- `"~45 perc"`
    - Hover: `scale-[1.02] shadow-xl` transition
    - Selected state (if revisiting): `ring-3 ring-primary`
  - Card for "Nogyogyaszat":
    - Background: `bg-green-card`
    - Same structure, duration: `"~30 perc"`
  - Motion: Cards use `staggerChildren: 0.15` entrance animation (fade up from `y: 20`)

**Click behavior**: Sets `appointmentTypeId`, `appointmentTypeName`, `appointmentTypeDuration`, advances to step 2.

#### Step 2 -- Valasszon datumot

**Data requirements**: After type is selected, fetch available dates for the next 60 days.
- **Server Action**: `getAvailableDates(appointmentTypeId, fromDate, toDate)` -- returns `string[]` of ISO date strings with at least one available slot
- This checks: `weekly_schedule` for the type, `schedule_overrides`, existing `appointments` for the date range

**Component**: `StepSelectDate`

**UI elements**:
- Heading: `"Valasszon datumot"`
- `<DatePicker>` component with:
  - `availableDates` = fetched available dates (only these are clickable)
  - `minDate` = today
  - `maxDate` = today + 60 days
  - Hungarian locale (Hetfo first, Hungarian month names)
- Legend below calendar:
  - Green dot + `"Szabad idopont"` (available)
  - Gray dot + `"Nem elerheto"` (no slots / closed)
- "Vissza" link below to return to step 1

**Loading**: While available dates load, show calendar skeleton with pulsing day cells.

**Click behavior**: Sets `selectedDate`, advances to step 3.

#### Step 3 -- Valasszon idopontot

**Data requirements**: After date is selected, fetch available time slots for that date.
- **Server Action**: `getAvailableSlots(appointmentTypeId, date)` -- returns `Timeslot[]` array
- Computes slots from schedule, subtracts booked appointments, respects overrides

**Component**: `StepSelectTime`

**UI elements**:
- Heading: `"Valasszon idopontot"` + date display below (`"2026. februar 25., szerda"`)
- `<TimeslotGrid>` component with available slots
- Each slot displays the time, duration noted once above the grid: `"Az idopont idotartama: 30 perc"`
- "Vissza" link to return to step 2

**No slots available** -- Waitlist signup:
- If `slots.length === 0`, instead of the grid, show a waitlist section:
- Container: `bg-background-light rounded-2xl p-6 text-center`
- Icon: Calendar with X mark, `text-gray-400 w-12 h-12 mx-auto mb-4`
- Title: `text-lg font-bold text-primary` -- `"Erre a napra sajnos nincs szabad idopont"`
- Subtitle: `text-sm text-gray-600 mb-6` -- `"Iratkozzon fel, es ertesitjuk, ha felszabadul egy idopont!"`
- Waitlist form:
  - Heading: `text-base font-semibold text-primary mb-3` -- `"Ertesitest kerek, ha felszabadul egy idopont"`
  - Email input: `<input type="email" placeholder="Email cim">`
  - Submit button: `"Feliratkozas"` -- `bg-accent text-primary rounded-xl px-5 py-2.5 font-bold text-sm`
  - Success message (replaces form): `"Sikeresen feliratkozott! Ertesitjuk, amint szabad idopont van."` with checkmark icon
- **Server Action**: `createWaitlistEntry(email, appointmentTypeId, date)`

**Click behavior**: Sets `selectedTime`, advances to step 4.

#### Step 4 -- Adja meg adatait

**Component**: `StepPatientInfo`

**UI elements**:
- Heading: `"Adja meg adatait"`
- Summary bar at top: `bg-background-light rounded-xl p-4 mb-6 flex flex-wrap gap-4 text-sm`
  - Type + date + time displayed as pills/badges
- Form fields:
  - `FormField "Vezeteknev" (required)` -- `<input type="text" placeholder="pl. Kovacs">`
  - `FormField "Keresztnev" (required)` -- `<input type="text" placeholder="pl. Anna">`
  - `FormField "Email cim" (required)` -- `<input type="email" placeholder="email@example.com">`
  - `FormField "Telefonszam" (required)` -- `<input type="tel" placeholder="+36 20 123 4567">`
- Grid: `grid grid-cols-1 sm:grid-cols-2 gap-4` for name fields, full width for email and phone
- "Vissza" link + "Tovabb" submit button

**Validation** (Zod, client-side + server-side):
```ts
const patientFormSchema = z.object({
  lastName: z.string().min(1, "A vezeteknev megadasa kotelezo"),
  firstName: z.string().min(1, "A keresztnev megadasa kotelezo"),
  email: z.string().email("Kerjuk, adjon meg egy ervenyes email cimet"),
  phone: z.string()
    .min(1, "A telefonszam megadasa kotelezo")
    .regex(/^\+?[0-9\s-]{7,15}$/, "Kerjuk, adjon meg egy ervenyes telefonszamot"),
});
```

**Error display**: Inline under each field in red, `text-xs text-red-600 mt-1`

**Click behavior**: Validates, sets `patient` data, advances to step 5.

#### Step 5 -- Visszaigazolas

**Component**: `StepConfirmation`

**UI elements**:
- Heading: `"Visszaigazolas"`
- Summary card: `bg-background-light rounded-2xl p-6`
  - Layout: two-column on desktop, stacked on mobile
  - Left: Appointment details
    - Type: `"Nogyogyaszati vizsgalat"` with color dot
    - Date: `"2026. februar 25., szerda"`
    - Time: `"14:00 -- 14:30"`
    - Duration: `"30 perc"`
  - Right: Patient details
    - Name: `"Kovacs Anna"`
    - Email: `"anna@example.com"`
    - Phone: `"+36 20 123 4567"`
  - Each item: `text-sm` with label in `text-gray-500` and value in `text-primary font-semibold`

- "Vissza" link (goes back to step 4)
- "Idopont foglalasa" primary CTA button:
  - `w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-colors`
  - Motion: subtle scale-up on hover

**Submit behavior**:
- **Server Action**: `createBooking(bookingData)` -- transactional:
  1. Upsert patient (by email)
  2. Create appointment with status `"confirmed"`
  3. Generate cancellation token
  4. Create Google Calendar event (if configured)
  5. Send confirmation email (using `booking_confirmed` template)
  6. Returns `{ success: true, appointmentId }` or `{ error: string }`
- Loading state: Button shows spinner, text changes to `"Foglalas folyamatban..."`, all inputs disabled
- Error: Toast with `"Hiba tortent a foglalas soran. Kerlek, probald ujra."` + re-enable form
- Success: Redirect to `/idopontfoglalas/visszaigazolas?id={appointmentId}`

**Race condition handling**: If the slot was taken between step 3 and submission, the DB exclusion constraint rejects the insert. The Server Action catches this and returns: `"Ez az idopont sajnos mar nem elerheto. Kerlek, valassz masik idopontot."` -- user is sent back to step 3 with fresh availability.

#### Progress Indicator

The `StepIndicator` component sits above the wizard at all times:
- Steps: `["Tipus", "Datum", "Idopont", "Adatok", "Osszesites"]`
- `currentStep` maps to `bookingState.step - 1` (0-indexed)

#### Responsive Behavior
- Step indicator: circles only on mobile, with labels on `sm+`
- Type selection cards: stack vertically on mobile
- Time slot grid: 3 columns on mobile, 5 on desktop
- Patient form: single column on mobile, two columns for name fields on `sm+`
- Confirmation summary: stacked on mobile, side-by-side on `md+`
- All step content has `max-w-2xl mx-auto` centering within the white section

#### SEO Metadata

```ts
export const metadata: Metadata = {
  title: "Idopontfoglalas",
  description: "Foglaljon idopontot online nogyogyaszati vizsgalatra vagy varandosgondozasra. Gyors es egyszeru online idopontfoglalas.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/idopontfoglalas" },
};
```

---

### 4.2 /idopontfoglalas/visszaigazolas

**Route**: `/idopontfoglalas/visszaigazolas`
**Mode**: Page is Server Component (fetches appointment by ID from searchParams)
**Layout**: Root layout (Header + Footer)

#### Component Tree
```
ConfirmationPage (server)
  +-- SectionWrapper (bg-white rounded-3xl p-6 md:p-10, max-w-2xl mx-auto)
        +-- SuccessAnimation (client)
        |     +-- Animated checkmark circle (Motion)
        +-- Heading "Sikeres foglalas!"
        +-- AppointmentSummary
        |     +-- Type, Date, Time, Duration
        +-- EmailNotice
        |     +-- "Visszaigazolo emailt kuldtunk a(z) email@example.com cimre"
        +-- CancellationNotice
        |     +-- "Az emailben talal egy linket, amellyel 24 oraval az idopont elott lemondhatja foglalasat."
        +-- HomeLink "Vissza a fooldallra" → /
```

#### Data Requirements
- **Server fetch**: `getAppointmentById(searchParams.id)` -- basic details for display (type, date, time, patient email)
- If `id` is missing or invalid: redirect to `/idopontfoglalas`

#### Key UI Elements

**Success animation**:
- Large green circle with checkmark, center of page
- `motion.div` with `initial={{ scale: 0 }} animate={{ scale: 1 }}` spring animation
- Circle: `w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-6`
- Checkmark: SVG, white, animated stroke with `pathLength` from 0 to 1

**Heading**: `text-2xl font-extrabold text-primary text-center`

**Appointment summary**:
- `bg-background-light rounded-2xl p-6 my-6`
- Details in vertical list with icons:
  - Type icon + `"Varandosgondozas"`
  - Calendar icon + `"2026. februar 25., szerda"`
  - Clock icon + `"14:00 -- 14:45"`
  - Hourglass icon + `"45 perc"`

**Email notice**:
- `text-sm text-gray-600 text-center` with email address in `font-semibold text-primary`

**Cancellation notice**:
- `bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 mt-4`
- Icon: info circle, yellow

**Home link**:
- Centered, `mt-8`
- `inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90`

#### Responsive Behavior
- Entire page content: `max-w-2xl mx-auto` -- narrow and centered
- Single column at all breakpoints
- Success circle: same size on all screens

---

### 4.3 /cancel/[token]

**Route**: `/cancel/[token]`
**Mode**: Page is Server Component for initial state resolution; cancel action is `"use client"`
**Layout**: Root layout (Header + Footer)

#### File Structure
```
src/app/cancel/[token]/
  page.tsx             -- Server Component, resolves token state
  CancelAction.tsx     -- "use client", handles cancel button click
```

#### State Resolution (Server-Side)

The page Server Component resolves the cancellation token into one of four states:

```ts
type CancelState =
  | { type: "valid"; appointment: AppointmentDetails }
  | { type: "expired"; appointment: AppointmentDetails }
  | { type: "invalid" }
  | { type: "already_cancelled"; appointment: AppointmentDetails };
```

Resolution logic:
1. Look up `appointments` by `cancellation_token = params.token`
2. If no match: state = `"invalid"`
3. If `status = "cancelled"`: state = `"already_cancelled"`
4. If `cancellation_token_expires_at < NOW()`: state = `"expired"`
5. Otherwise: state = `"valid"`

#### Component Tree
```
CancelPage (server -- resolves state)
  +-- SectionWrapper (bg-white rounded-3xl p-6 md:p-10, max-w-2xl mx-auto)
        +-- [ValidCancel] (if state = "valid")
        |     +-- AppointmentDetails
        |     +-- WarningText
        |     +-- CancelAction (client)
        |           +-- CancelButton "Idopont lemondasa"
        |           +-- BackLink "Megsem"
        |     +-- [SuccessState] (after successful cancellation)
        +-- [ExpiredCancel] (if state = "expired")
        +-- [InvalidCancel] (if state = "invalid")
        +-- [AlreadyCancelled] (if state = "already_cancelled")
```

#### State: Loading

Not applicable since the token is resolved server-side. However, the `CancelAction` client component shows a loading state when the cancel button is clicked:
- Button text: `"Idopont lemondasa..."` with spinner
- Button disabled with `opacity-70`

#### State: Valid (Can Cancel)

**UI elements**:
- Icon: Calendar with warning, `text-primary w-16 h-16 mx-auto mb-6`
- Heading: `text-2xl font-extrabold text-primary text-center` -- `"Idopont lemondasa"`
- Appointment details card: `bg-background-light rounded-2xl p-6 my-6`
  - Type, date, time (same format as confirmation page)
- Warning text: `text-sm text-gray-600 text-center mb-6` -- `"Az idopont lemondasa vegleges."`
- Cancel button: `w-full sm:w-auto px-8 py-3 rounded-xl bg-red-600 text-white font-bold text-base hover:bg-red-700 transition-colors`
  - Text: `"Idopont lemondasa"`
- "Megsem" link: `text-sm text-gray-500 hover:text-primary font-medium mt-3` -- navigates back (or to homepage)

**Server Action** on cancel: `cancelAppointment(token)`:
1. Update appointment `status = 'cancelled'`, `cancelled_at = NOW()`
2. Send cancellation email to patient (using `booking_cancelled` template)
3. Notify doctor (if template configured for `recipientType = "both"` or `"doctor"`)
4. Check waitlist for matching entries, trigger notifications if found
5. Delete Google Calendar event (if `googleEventId` exists)
6. Return `{ success: true }`

After success, the `CancelAction` component transitions to the success state (in-place, no navigation).

#### State: Success (After Cancellation)

**UI elements**:
- Green checkmark animation (same as confirmation page)
- Heading: `text-2xl font-extrabold text-primary text-center` -- `"Az idopont sikeresen lemondva"`
- Appointment details card (now showing `<StatusBadge status="cancelled">`)
- Notice: `text-sm text-gray-600 text-center` -- `"Lemondasi visszaigazolast kuldtunk emailben."`
- Home link: `"Vissza a fooldallra"` button

#### State: Expired

**UI elements**:
- Warning icon: `text-yellow-500 w-16 h-16 mx-auto mb-6` (clock with exclamation)
- Heading: `text-2xl font-extrabold text-primary text-center` -- `"A lemondasi hatarido lejart"`
- Explanation: `text-sm text-gray-600 text-center max-w-md mx-auto` -- `"Az idopont mar nem mondhato le, mivel kevesebb, mint 24 ora van hatra."`
- Contact info: `bg-background-light rounded-2xl p-6 text-center mt-6`
  - `"Kerlik, hivjon minket:"` + phone number as `tel:` link
  - Phone: `text-lg font-bold text-primary` -- `"+36 70 639 5239"`

#### State: Invalid

**UI elements**:
- Error icon: `text-red-400 w-16 h-16 mx-auto mb-6` (circle with X)
- Heading: `text-2xl font-extrabold text-primary text-center` -- `"Ervenytelen lemondasi link"`
- Explanation: `text-sm text-gray-600 text-center max-w-md mx-auto` -- `"Ez a lemondasi link ervenytelen vagy mar felhasznalasra kerult."`
- Home link: `"Vissza a fooldallra"` button

#### State: Already Cancelled

Same rendering as "Invalid" but with a more specific message:
- Heading: `"Ez az idopont mar le lett mondva"`
- Explanation: `"Ez az idopont korabbban mar lemondásra kerult."`
- Appointment details shown with `<StatusBadge status="cancelled">`

#### Responsive Behavior
- All states: `max-w-2xl mx-auto`, centered single column
- Cancel button: full width on mobile, auto width on desktop
- Icons and headings: centered at all sizes

#### SEO Metadata

```ts
export const metadata: Metadata = {
  title: "Idopont lemondasa",
  robots: { index: false, follow: false },  // noindex -- private cancellation page
};
```

---

## 5. Accessibility Checklist (All Pages)

The following accessibility standards apply across the entire booking system:

1. **Semantic HTML**: Use `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>` appropriately. Admin sidebar is `<nav aria-label="Admin navigacio">`.
2. **ARIA labels**: All interactive elements without visible text labels have `aria-label`. Form fields linked via `htmlFor`/`id`.
3. **Focus management**: Step transitions in booking wizard move focus to the new step heading. Modal open moves focus to first interactive element. Modal close returns focus to trigger.
4. **Keyboard navigation**: All interactive elements reachable via Tab. Calendar date cells navigable with arrow keys. ESC closes modals and dropdowns.
5. **Color contrast**: All text meets WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text). Status badges use both color and text labels.
6. **Reduced motion**: `<MotionConfig reducedMotion="user">` respects `prefers-reduced-motion`. All animations skip to final state when preference is set.
7. **Screen reader**: Status changes announced via `aria-live="polite"` regions. Form errors linked with `aria-describedby`. Toast notifications use `role="status"`.
8. **Touch targets**: Minimum 44x44px touch targets on all interactive elements (buttons, links, calendar cells, time slots).

---

## 6. Route Map Summary

| Route | Type | Auth | Layout | Description |
|-------|------|------|--------|-------------|
| `/admin/login` | Page | No | Standalone | Admin login form |
| `/admin` | Page | Admin | AdminLayout | Dashboard with today's overview |
| `/admin/appointments` | Page | Admin | AdminLayout | Calendar/list of all appointments |
| `/admin/appointments/[id]` | Page | Admin | AdminLayout | Appointment detail + status management |
| `/admin/patients` | Page | Admin | AdminLayout | Patient search + list (2,300+ paginated) |
| `/admin/patients/[id]` | Page | Admin | AdminLayout | Patient profile + appointment history |
| `/admin/schedule` | Page | Admin | AdminLayout | Weekly hours + date overrides |
| `/admin/appointment-types` | Page | Admin | AdminLayout | Manage appointment types |
| `/admin/messages` | Page | Admin | AdminLayout | Email template editor |
| `/admin/waitlist` | Page | Admin | AdminLayout | Waitlist management |
| `/admin/settings` | Page | Admin | AdminLayout | Clinic settings (singleton) |
| `/admin/users` | Page | Admin (admin role only) | AdminLayout | User management |
| `/idopontfoglalas` | Page | No | Root (Header+Footer) | 5-step public booking wizard |
| `/idopontfoglalas/visszaigazolas` | Page | No | Root (Header+Footer) | Booking success page |
| `/cancel/[token]` | Page | No | Root (Header+Footer) | Appointment cancellation |

---

## 7. New npm Dependencies

The following packages are required in addition to the existing `package.json`:

```bash
# Authentication
npm install next-auth@5            # NextAuth v5 (App Router native)

# Form validation
npm install zod                     # Schema validation (shared client/server)

# Date handling
npm install date-fns                # Date formatting + manipulation
npm install @date-fns/locale        # Hungarian locale for date-fns (hu)

# No additional UI libraries needed -- Tailwind v4 + Motion v12 cover all UI needs
```

**NOT adding**:
- No component library (Radix, Headless UI, shadcn) -- custom components match the existing bespoke design system
- No CSS-in-JS -- Tailwind only
- No charting library (not required per spec)
- No drag-and-drop library -- calendar view uses click navigation, not drag; appointment type reorder uses up/down buttons

---

## 8. File Tree (New Files)

```
src/
  app/
    admin/
      layout.tsx                          -- AdminLayout wrapper + session check
      page.tsx                            -- Dashboard
      login/
        page.tsx                          -- Login page
      appointments/
        page.tsx                          -- Appointments list/calendar
        [id]/
          page.tsx                        -- Appointment detail
      patients/
        page.tsx                          -- Patients list
        [id]/
          page.tsx                        -- Patient detail
      schedule/
        page.tsx                          -- Weekly schedule + overrides
      appointment-types/
        page.tsx                          -- Appointment type management
      messages/
        page.tsx                          -- Message template editor
      waitlist/
        page.tsx                          -- Waitlist management
      settings/
        page.tsx                          -- Doctor/clinic settings
      users/
        page.tsx                          -- Admin user management
    idopontfoglalas/
      page.tsx                            -- Public booking page (server)
      BookingWizard.tsx                   -- Multi-step state machine (client)
      steps/
        StepSelectType.tsx
        StepSelectDate.tsx
        StepSelectTime.tsx
        StepPatientInfo.tsx
        StepConfirmation.tsx
      visszaigazolas/
        page.tsx                          -- Booking confirmation
    cancel/
      [token]/
        page.tsx                          -- Cancellation page (server)
        CancelAction.tsx                  -- Cancel button (client)
  components/
    admin/
      AdminLayout.tsx                     -- Sidebar + header wrapper
      AdminSidebar.tsx                    -- Navigation sidebar
      AdminHeader.tsx                     -- Top bar with user menu
      DataTable.tsx                       -- Generic sortable/paginated table
      StatusBadge.tsx                     -- Status pill badges
      EmptyState.tsx                      -- No-data placeholder
      WeekCalendar.tsx                    -- Appointments week calendar view
      TodayTimeline.tsx                   -- Dashboard timeline
    booking/
      TimeslotGrid.tsx                    -- Time slot selection grid
      StepIndicator.tsx                   -- Progress dots/breadcrumb
      WaitlistSignup.tsx                  -- Waitlist email signup form
    ui/
      DatePicker.tsx                      -- Hungarian calendar picker
      DateRangePicker.tsx                 -- Date range selection
      ConfirmDialog.tsx                   -- Modal confirmation
      Toast.tsx                           -- Toast notification component
      ToastProvider.tsx                   -- Toast context provider
      FormField.tsx                       -- Form field wrapper
      Skeleton.tsx                        -- Skeleton loaders
      Switch.tsx                          -- Toggle switch component
  middleware.ts                           -- NextAuth route protection (updated)
```

---

## 9. Open Questions

1. **Admin appointment creation**: The spec mentions a "Uj idopont" quick action button on the dashboard. Should this open a modal or navigate to a dedicated creation page? Current design assumes it links to `/admin/appointments?new=true` which opens a creation modal overlay on the appointments page.

2. **Calendar drag-and-drop**: The spec mentions `(draggable?)` for appointment blocks in the calendar view. This document does NOT include drag-and-drop functionality to keep complexity low. If needed later, consider `@dnd-kit/core` for accessible drag-and-drop.

3. **Real-time updates**: The dashboard and appointment views currently use standard page navigation for fresh data. If real-time updates are needed (e.g., new booking appears on dashboard without refresh), consider polling via `useEffect` + `setInterval` (every 30s) or Server-Sent Events.

4. **Admin mobile experience**: The admin panel is designed as mobile-usable but desktop-optimized. Calendar view is disabled on mobile. Should we invest in a fully native-like mobile admin experience, or is desktop-primary acceptable?

5. **Message template HTML editor**: Currently, the template body is a plain `<textarea>`. If rich-text email formatting is needed (bold, links, etc.), a Markdown editor or minimal WYSIWYG could be added later.
