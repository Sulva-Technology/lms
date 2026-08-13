# VUI LMS System Instructions & Design Rules

Whenever you are tasked to create, update, or suggest a page, layout, or component for VUI LMS, you MUST adhere strictly to the following aesthetic rules and anti-patterns. 

## 🚫 STRICTLY AVOID
- **Legacy/Generic UI:** Old-school university portal UIs, flat boring admin dashboards, generic LMS designs, designs that look like Moodle, or government portals. Do not use generic Bootstrap-style templates.
- **Clutter & Confusion:** Overcrowded screens, cluttered data tables, confusing navigation, and weak visual hierarchy.
- **Poor Aesthetics:** Low-contrast glassmorphism, random gradients without a lighting or structural purpose, childish colors.
- **Bad Mobile & Accessibility UX:** Poorly thought-out mobile layouts, tiny unreadable text, and designs that ignore accessibility standards (WCAG).
- **Animation Extremes:** Excessive/distracting animation. However, **never** provide designs without any animation behavior.
- **Incomplete Deliverables:** Designs without clear, practical developer implementation notes.

## ✅ ALWAYS ENSURE
- **Premium Feel:** High-contrast, legible glassmorphism over soft ambient gradient meshes.
- **Modern SaaS & Material You:** Smooth rounded corners, floating panels, deep cohesive shadows.
- **Clear Readability:** Solid surfaces where necessary (e.g., dense data tables) combined with glass UI for summaries and analytics to preserve legibility.
- **Motion & Polish:** Include Framer Motion usage, hover states, micro-interactions (staggered loads, active bounds, success/error feedback).
- **Actionable Developer Notes:** Always specify Tailwind classes, layout structure, responsive breakpoints, and Framer Motion variants.
