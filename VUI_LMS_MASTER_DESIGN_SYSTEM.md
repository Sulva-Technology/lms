# VUI LMS: Master UI/UX Design System & Frontend Architecture

**Version:** 1.0.0
**Role:** Lead Product Designer & Frontend Architect
**Stack:** Next.js 15, React, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React

---

## 1. Product Design Vision & Principles

**Vision:** To transform the traditionally clunky, anxiety-inducing university portal experience into a premium, consumer-grade software environment. VUI LMS must feel as frictionless as Netflix, as polished as Stripe, and as immersive as a modern video game, while retaining absolute academic rigor and trust.

**Design Principles:**
1. **Focus Over Feature Bloat:** Use glassmorphism and depth to hide secondary actions until needed.
2. **Academic Trust:** Use solid, high-contrast surfaces for dense data (grades, admin tables) to ensure legibility and professional weight.
3. **Immersive Learning:** Once a student enters a video or live class, the UI fades away (Theater Mode).
4. **Physicality in Motion:** Everything responds to interaction. Hovering lifts cards, success actions draw paths, errors shake.

---

## 2. Visual Identity & Design Tokens

### 2.1 Color System
The platform operates on a **Dark-First Ambient Theme**.
*   **Base/Background:** Deep Slate (`#020617` to `#0f172a`).
*   **Text:** Primary `text-slate-50`, Secondary `text-slate-400`.
*   **Role Accents:**
    *   **Student:** Blue (`#3b82f6`) & Cyan.
    *   **Lecturer:** Violet (`#8b5cf6`) & Indigo.
    *   **Admin/Super Admin:** Emerald (`#10b981`) & Teal.
*   **Functional:** Error (Red-500), Warning (Orange-500), Success (Emerald-500).

### 2.2 Typography System
*   **Primary (UI & Body):** `Inter` (sans-serif). Legible, neutral, excellent for dense data.
*   **Headings/Display:** `Outfit` or `Space Grotesk`. Geometric, modern, premium.
*   **Hierarchy:** `text-4xl font-semibold` (Page Headers), `text-sm font-medium` (Component Labels).

### 2.3 Gradient & Glassmorphism System
*   **The Ambient Canvas:** The `body` background always contains massive, slowly rotating blurred orbs (`bg-blue-600/20 blur-[150px] mix-blend-screen`).
*   **Heavy Glass (Modals, Sidebars, Nav):** `bg-slate-900/80 backdrop-blur-3xl border border-white/10`. Completely blurs the background.
*   **Light Glass (Cards):** `bg-white/5 backdrop-blur-md border border-white/10`. Allows ambient light to tint the card softly.

### 2.4 Shadows & Border Radius
*   **Shadows:** Use glowing colored shadows for active states (`shadow-[0_0_20px_rgba(59,130,246,0.3)]`). Deep drop shadows for floating panels to create depth.
*   **Border Radius:** 
    *   Cards & Modals: `rounded-[24px]` to `rounded-[32px]` (Modern iOS/Material You feel).
    *   Buttons & Inputs: `rounded-full` for primary CTAs, `rounded-xl` for standard inputs.

---

## 3. Motion Design System (Framer Motion)

Motion provides context, spatial awareness, and delight. 

*   **Page Transitions:** Soft fade and slight upward drift. `initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}`.
*   **Staggered Reveal:** Dashboard cards always enter sequentially. `staggerChildren: 0.05`.
*   **Hover/Tap:** Buttons and cards exhibit physicality. `whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}`.
*   **Layout Animations:** Use `<motion.div layout>` for sidebars expanding, accordions opening, or items moving between lists.
*   **Micro-interactions:**
    *   Success: Animated SVG checkmark `pathLength: 0 -> 1`.
    *   Error: Horizontal shake `x: [-10, 10, -10, 10, 0]`.
    *   Progress Rings: Smooth `strokeDashoffset` animation on load.

---

## 4. App Shell & Role-Based Navigation

### 4.1 Layout Components
*   **Top Nav:** Sticky Heavy Glass header. Contains Breadcrumbs, Global Search (`Cmd+K`), Notifications, Avatar.
*   **Sidebar:** Left-aligned. Collapsible. Role-specific.
*   **Main Content:** `flex-1 overflow-y-auto`. Content constrained to `max-w-7xl` or full-bleed depending on view.

### 4.2 Role-Based Routing
*   **Student:** Dashboard, My Courses, Registration, Live Classes, Grades, Quizzes, Calendar.
*   **Lecturer:** Dashboard, Assigned Courses, Start Live Class, Gradebook, Recordings, Announcements.
*   **Admin/Super Admin:** Dashboard, University Setup, Faculties, Users, Courses, Reports, Settings.

---

## 5. Screen Specifications

### 5.1 Auth, Onboarding & Landing Page
*   **Landing Page:** B2B SaaS layout. Floating perspective mockups of dashboards over an animated mesh gradient. "Book Demo" and "Login" CTAs.
*   **Auth/Login:** Centered Glass Card. Email/Password or SSO. Animated input glow on focus.
*   **Role Onboarding:** Multi-step wizard. Students upload photos; Admins set up 2FA.

### 5.2 Course Registration (Student)
*   **Layout:** 2-Column. Left is a Glass Stepper (Compulsory -> Electives -> Review). Right is a sticky Summary Widget with a filling Credit Unit Bar.
*   **Interaction:** Clicking "Add Elective" traces a Shared Element transition to the summary cart. Prerequisites failing shake the card and block the action.

### 5.3 Dashboards
*   **Student Dashboard:** Welcome Hero (Time-based greeting). Horizontal scroll of "Continue Learning". Vertical grid of upcoming deadlines and live classes.
*   **Lecturer Dashboard:** Focus on action. Quick action pills ("Schedule Class", "Grade Submissions"). Pending tasks pulse slightly if overdue.
*   **Admin Dashboard:** Dense, high-utility. Glass top cards for macro stats. Solid-surface `bg-slate-900` large data tables for user/course management to ensure perfect legibility. Sticky table headers.

### 5.4 Course Learning Page
*   **Layout:** Hero banner spanning top (Course Title, Progress Ring). 2-Column body (Curriculum Accordion on left, Lecturer Profile/Syllabus sticky on right).
*   **Curriculum Tab:** Framer Motion accordions. Clicking a module slides open to reveal lesson cards.

### 5.5 Video Lesson Player
*   **Layout:** Full-bleed Theater Mode. Video center. Right sidebar (collapsible) for curriculum. Bottom tabs for Transcript, Notes, Q&A, Resources.
*   **Video Controls:** Floating glass pill at the bottom `backdrop-blur-2xl`. Fades out after 3s of inactivity.
*   **Transcript:** Active line syncs with video time, highlighting in bright white while others remain subdued.

### 5.6 Live Class (Waiting Room & Classroom)
*   **Waiting Room:** Floating card. "Waiting for Host..." pulsing text. Camera/Mic preview.
*   **Classroom:** Main stage (Screenshare/Speaker). Floating bottom control pill (Mic, Cam, Hand, Leave). Right sidebar (Chat, Participants).
*   **Animations:** Active speaker gets a glowing border. Raised hand icon bounces.

### 5.7 Assignments, Quizzes & Grades
*   **Quizzes:** Focus Mode. One question per screen. Progress bar at top. "Submit" triggers a confirmation modal.
*   **Gradebook:** Solid surface table. Red/Green text highlights for failing/passing metrics.

---

## 6. Global UX States

### 6.1 Empty States
*   **Visual:** Centered in container. Large faded icon (20% opacity), soft subtitle, primary CTA button (e.g., "Add your first module").
*   **Animation:** Gentle vertical float.

### 6.2 Loading States
*   **Skeletons:** `animate-pulse bg-slate-800/50`. Skeletons must exactly match the border radius and approximate shape of the incoming content. Avoid generic spinners for page loads.

### 6.3 Error States
*   **Inline/Form:** Red text slides down under input. Input border glows red.
*   **Page Level:** Glass card with a red boundary, explaining the error (e.g., 404, 500) with a "Return to Dashboard" CTA.

### 6.4 Responsive Mobile Behavior (< 768px)
*   **Navigation:** Sidebar moves to a Bottom Navigation Pill. Complex menus become full-screen modal overlays.
*   **Tables:** Horizontal scrolling OR transformed into stacked cards.
*   **Live/Video:** Video sticks to top, tabs stack underneath. Chat becomes a drag-up bottom sheet.

---

## 7. Developer Handoff Notes & Implementation

### 7.1 Tailwind CSS Configuration
Add tokens directly to `globals.css` using Tailwind v4 `@theme`.
```css
@theme {
  --color-vui-blue: #3b82f6;
  --color-vui-purple: #8b5cf6;
  --font-outfit: 'Outfit', sans-serif;
}
```

### 7.2 Framer Motion Reusable Variants
Maintain an `animations.ts` file for consistency:
```ts
export const VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  },
  staggerContainer: {
    visible: { transition: { staggerChildren: 0.05 } }
  }
};
```

### 7.3 Accessibility
*   **Contrast:** Ensure text over blurred glass is pure white (`#fff`) or extremely light slate (`#e2e8f0`).
*   **Reduced Motion:** Wrap heavy animations (blobs, page transitions) with `useReducedMotion()` checks to disable them for users who require it.
*   **Focus Rings:** Never remove outlining without replacing it. Use `focus:ring-2 focus:ring-blue-500/50 focus:outline-none`.

### 7.4 Recommended Components Structure Let
Rely on ShadCN UI patterns but heavily customize the styles to match the glassmorphism aesthetic.
*   `ui/glass-card.tsx`
*   `ui/glass-button.tsx`
*   `ui/animated-progress.tsx`
*   `layouts/app-shell.tsx`
*   `layouts/focus-mode.tsx`

---
*End of Master Design System Document. Consult individual component/feature .md files for granular specs.*
