# Sulva LMS Design System

**Version:** 1.0.0
**Target Stack:** Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Lucide React

Sulva LMS is a premium university-focused learning management system. This document outlines the comprehensive design system, combining Udemy-level course learning UX, Google Material You-inspired softness, deep glassmorphism aesthetics, and smooth Framer Motion-style animations.

---

## 1. Brand Personality
- **Premium & Futuristic:** Feels like a high-end SaaS product, not a legacy university portal.
- **Academic & Trustworthy:** Maintains authority and clarity suitable for higher education.
- **Immersive & Smooth:** Uses fluid motion and depth to create an engaging learning environment.
- **Accessible & Clean:** Prioritizes content readability and intuitive navigation.

## 2. Visual Direction
- **Udemy-style UX:** Strong video-first interfaces, prominent progress tracking, beautiful course cards, and curriculum sidebars.
- **Material You softness:** Soft rounded corners (large radii), adaptive colors, large touch targets, and clear visual hierarchy.
- **Glassmorphism:** Layered depth with backdrop blurs, semi-transparent panels, and subtle border highlights over gradient backgrounds.
- **Dark Mode Default:** The primary theme is a rich dark mode (`slate-950` base) to enhance the glassmorphism and reduce eye strain during long study sessions.

## 3. Color Palette
The color system uses deep base colors with vibrant, role-based accents.

**Base Neutral (Slate)**
- Background: `slate-950` (#020617)
- Surface/Glass Heavy: `slate-900` (#0f172a) with opacity
- Borders: `slate-800` (#1e293b)
- Muted Text: `slate-400` (#94a3b8)
- Primary Text: `slate-50` (#f8fafc)

**Role-based Accents**
- **Student (Primary):** Blue (`blue-500` #3b82f6) / Cyan (`cyan-400` #22d3ee)
- **Lecturer:** Violet (`violet-500` #8b5cf6) / Indigo (`indigo-500` #6366f1)
- **Admin:** Emerald (`emerald-500` #10b981) / Teal (`teal-400` #2dd4bf)
- **Super Admin:** Slate (`slate-700`) with Gold (`amber-400` #fbbf24) highlights.
- **Error/Destructive:** Red (`red-500` #ef4444)
- **Warning/Pending:** Orange (`orange-500` #f97316)
- **Success:** Emerald (`emerald-500` #10b981)

## 4. Gradient System
Use gradients sparingly to create depth and highlight active states, never to overwhelm content.
- **Background Ambient Glow:** Large, extremely blurred radial gradients in the background (e.g., `radial-gradient(circle at 15% 50%, rgba(30, 58, 138, 0.3) 0%, transparent 50%)`).
- **Text Gradients:** Horizontal linear gradients for key headings (e.g., `bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent`).
- **Progress Bars:** Vibrant linear gradients from Blue to Purple (`from-blue-600 to-purple-500`).

## 5. Glassmorphism Rules
- **Base Glass:** `bg-white/5` (or `rgba(255,255,255,0.03)`), `backdrop-blur-md` (12px-16px).
- **Heavy Glass (for contrast):** `bg-slate-900/60`, `backdrop-blur-xl` (24px).
- **Borders:** Always use a 1px border. `border-white/10` or `border-slate-800`. Include a subtle top/left highlight if possible using box-shadow inset.
- **Usage:** Restrict to hero sections, dashboard floating sidebars, course cards, live class floating controls, and modals. Do not use for dense data tables.

## 6. Background Design Rules
- Avoid flat `#000000` or `#111111`.
- Use a very dark slate (`#020617`) as the absolute base.
- Layer subtle ambient structural gradients (as described in section 4) to give the application environment "volume" and lighting.

## 7. Typography Scale
**Fonts:**
- Headings/Display: `Outfit` (sans-serif, geometric, modern tech feel).
- Body/UI/Data: `Inter` (sans-serif, highly legible, clean).

**Scale (Tailwind standard):**
- Display: `text-5xl` or `text-4xl` (`Outfit`, `font-semibold`, `tracking-tight`)
- Header 1 (Page): `text-3xl` (`Outfit`, `font-semibold`)
- Header 2 (Section): `text-2xl` (`Outfit`, `font-semibold`)
- Header 3 (Card): `text-lg` or `text-xl` (`Outfit`, `font-medium`)
- Body Large: `text-base` (`Inter`, `text-slate-300`)
- Body Default: `text-sm` (`Inter`, `text-slate-300`)
- Body Small (Meta): `text-xs` (`Inter`, `text-slate-400`)

## 8. Spacing Scale
Follow an 8pt grid system using Tailwind's default spacing.
- Micro: `gap-2` (8px), `p-2`
- Small: `gap-4` (16px), `p-4`
- Medium: `gap-6` (24px), `p-6` (Standard card padding)
- Large: `gap-8` (32px), `p-8` (Section gaps)
- Extra Large: `gap-12` or `gap-16` (Major page sections)

## 9. Border Radius System (Material You inspired)
Embrace soft, large, friendly corners.
- **Buttons / Tags:** `rounded-full` (pill shape).
- **Small Elements (Inputs, inner items):** `rounded-xl` (12px).
- **Standard Cards / Modals:** `rounded-2xl` (16px) or `rounded-[24px]`.
- **Large Layout Panels (Sidebars, Hero):** `rounded-[32px]` or flat if bleeding to edge.

## 10. Shadow System
Drop shadows should be colored and diffuse, not harsh black.
- **Glow Shadow (Hover):** `shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)]`
- **Soft Panel Shadow:** `shadow-xl shadow-black/20`
- **Inner Highlight (Glass):** `shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]`

## 11. Blur System
- **Backdrop:** `backdrop-blur-md` (12px) for general glass. `backdrop-blur-xl` (24px) for modals and sticky headers.
- **Ambient Element Blurs:** `blur-[50px]` to `blur-[100px]` for background gradient orbs (`bg-blue-500/20`).

## 12. Iconography Style
- **Library:** `lucide-react`
- **Style:** Stroke width 2 or 1.5. Clean, line-based.
- **Sizing:** `size={16}` for inline/meta, `size={20}` for nav items, `size={24}` for primary actions.
- **Color:** Muted (`text-slate-400`) by default, bright accent (`text-blue-400`) when active or hovered. Use subtle drop-shadows on active icons (`drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]`).

## 13. Illustration Style
- Avoid overly playful generic flat illustrations (e.g., standard unDraw).
- Prefer abstract 3D shapes, high-quality photography with darkened overlays, or custom minimalist sleek line art.
- Placeholder images (e.g., courses) should use abstract, tech, or architectural seeds (`https://picsum.photos/seed/tech/...`).

## 14. Card Components
**Variants:**
- **Standard Glass Card:** `bg-white/5 border border-white/10 rounded-[24px] p-6`.
- **Interactive Card:** Add `hover:-translate-y-1 hover:shadow-glow transition-all duration-300`.
- **Accent Card:** Include a colored blur orb in the top right absolute corner (`bg-blue-500/10 blur-[50px]`).

## 15. Button Components
**Variants:**
- **Primary (Solid):** Pill shape. `bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]`.
- **Secondary (Glass):** `bg-white/5 border border-white/10 hover:bg-white/10 text-white`.
- **Ghost:** `hover:bg-white/5 text-slate-300 hover:text-white`.
- **States:** Include `disabled:opacity-50 disabled:cursor-not-allowed`. Add subtle scale down on `:active` (`active:scale-95`).

## 16. Form Components
- **Inputs:** `bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200`.
- **Focus State:** `focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all`.
- **Placeholders:** `placeholder:text-slate-500`.

## 17. Navigation Components
- **Sidebar:** Heavy glass (`bg-slate-900/60 backdrop-blur-2xl`), floating or sticky. Active items get a subtle background highlight (Framer Motion `layoutId` for smooth pill sliding) and colored icon.
- **Topbar:** Sticky, integrates global search, notifications, and user profile.
- **Sub-nav / Tabs:** Clean text links with animated under-borders or floating background pills.

## 18. Dashboard Widgets
- Modular `rounded-[24px]` glass panels.
- Content: Academic overview (GPA, credits), Upcoming Deadlines list, Live Schedule timeline.
- Micro-interactions: Skeleton loading before data populates.

## 19. Course Cards (Udemy-level)
- **Top:** 16:9 Image cover with a dark overlay that fades on hover.
- **Hover Play Button:** Center play icon appears smoothly on hover.
- **Body:** Course Title (`line-clamp-2`), Instructor.
- **Bottom:** Progress bar (gradient), Time remaining, Chapter count.
- **Animation:** Card lifts, image slightly zooms (`scale-105`), play button fades in.

## 20. Video Player UI Components
- Immersive edge-to-edge player within the content area.
- Autohiding bottom control bar (glassmorphism overlay).
- Sidebar for curriculum: Shows current playing video, completed markers (green checks), locked videos (padlock icon).

## 21. Live Class Components
- **Live Badge:** Red pulsing dot `animate-ping` with text "LIVE".
- **Controls:** Floating pill-shaped glass bar at bottom center for Mic, Cam, Screen Share, Chat, Leave.
- **Chat:** Sticky sidebar with message bubbles. Differentiate instructor messages with a subtle border/background.

## 22. Admin Table Components
- Less glass, more clarity. Use `bg-slate-900/40`.
- Simple horizontal borders (`border-b border-slate-800`).
- High-contrast column headers (`text-xs uppercase tracking-wider text-slate-400 font-semibold`).
- Hover rows (`hover:bg-white/5`).
- Use contextual menus (three dots) for row actions.

## 23. Notification Components
- **Icon:** Bell icon with absolute positioned red/blue dot indicator.
- **Dropdown:** Glass panel modal with list of notifications grouped by "New" and "Earlier".
- **Toasts:** Floating bottom-right notifications, sliding in from right, with auto-dismiss progress bar.

## 24. Progress Indicators
- **Bars:** `h-2 rounded-full bg-slate-800` containing a `.bg-gradient-to-r.from-blue-500.to-purple-500` moving element.
- **Rings:** Circular SVG progress bars with stroke-dashoffset transitions for course completion overview.
- **Spinners:** Simple 2px border, `border-t-blue-500 rounded-full animate-spin`.

## 25. Loading Skeletons
- Standardize on `animate-pulse` or a shimmering gradient.
- Use `bg-slate-800/50` for the skeleton blocks.
- Match corner radii of the component they are replacing (e.g., `rounded-[24px]` for course cards).

## 26. Empty States
- Vertically and horizontally centered within their container.
- Large, muted icon (e.g., `BookX` or `Inbox` `size={48} text-slate-700`).
- Short `text-lg` heading and `text-sm text-slate-400` description.
- Primary CTA to create or explore content.

## 27. Error States
- Similar to empty states but use red hues (`text-red-400`, `bg-red-500/10`).
- Include actionable "Try Again" or "Contact Support" buttons.
- Toasts for inline errors should vibrate/shake briefly on entrance.

## 28. Success States
- Emerald and Teal accents.
- Confetti micro-animations or checkmark draw-in animations for major milestones (e.g., Course Completed).

## 29. Mobile Design Rules
- Collapse sidebars into a bottom navigation bar or a hamburger menu drawer.
- Ensure touch targets are minimum `44px` tall.
- Remove heavy glass blurs if performance on mobile drops (fallback to solid `bg-slate-900`).
- Course cards stack vertically; horizontal scrolling carousels for Continue Learning to save vertical space.

## 30. Accessibility Rules
- **Contrast:** Ensure all text against glass backgrounds maintains minimum 4.5:1 contrast. Use `text-slate-50` for primary text.
- **Focus Rings:** Ensure all interactive elements have visible focus states (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`).
- **Screen Readers:** Use semantic HTML (`<nav>`, `<main>`, `<article>`) and `aria-labels` for icon-only buttons.
- **Motion:** Respect `prefers-reduced-motion` to disable spring animations and use simple fades instead.

---
*End of Design System Document*
