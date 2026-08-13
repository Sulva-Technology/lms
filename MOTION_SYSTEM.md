# VUI LMS Motion Design System

**Version:** 1.0.0
**Target Framework:** React + Framer Motion
**Design Philosophy:** Fluid, Intentional, Premium, and Unobtrusive.

This document outlines the animation standards for VUI LMS. Our motion language combines the physical, tactile feel of Material You with the sleek, high-end polish of modern glassmorphism. Animations must feel natural, guiding the user's eye without ever blocking their workflow.

---

## 1. Core Motion Principles
- **Spatial Awareness:** Elements move logically from their origin. Dropdowns expand from their trigger; modals scale up from the center or slide up from the bottom.
- **Physics over Time:** Default to spring physics rather than rigid duration-based easing. Elements should have mass and momentum but minimal bounce.
- **Hierarchy of Motion:** Fast micro-interactions (< 200ms) for UI feedback. Slower, staggered animations (300-500ms) for data loads and page transitions.
- **Premium Restraint:** Avoid oversized bounces, rubber-banding, or overly dramatic spins. Keep it academic and trustworthy.

## 2. Timing Rules
- **Micro-interactions (Hover, Tap, Toggles):** 100ms - 150ms
- **Small expands (Accordions, Dropdowns):** 200ms - 250ms
- **Medium transitions (Modals, Toast notifications):** 300ms - 400ms
- **Large entrances (Page load, Staggered widgets):** 500ms - 800ms
- **Continuous/Looping (Live indicators):** 1500ms - 2000ms cycles

## 3. Recommended Easing & Springs
In Framer Motion, prefer `spring` over `tween` for structural animations.

```typescript
// Smooth, no bounce (Page transitions, Modals)
export const springSmooth = { type: "spring", stiffness: 300, damping: 30 };

// Slightly playful (Cards hover, Toggles, Tags)
export const springSnappy = { type: "spring", stiffness: 400, damping: 25 };

// Gentle reveal (Fade ups, Image loads)
export const easeOutFade = { type: "tween", ease: "easeOut", duration: 0.4 };
```

---

## 4. Page & System Animations

### Page Transitions
- **Fade & Slide:** `initial={{ opacity: 0, y: 10 }}` to `animate={{ opacity: 1, y: 0 }}`.
- Exit animations are typically simple fades `exit={{ opacity: 0 }}`.

### Dashboard Entrance Animations
- **Staggered Orchestration:** Wrap dashboard columns in a parent with `staggerChildren: 0.1`.
- Widgets slide up 20px and fade in. This directs the user's attention from top-left to bottom-right smoothly.

### Glass Panel Animations
- **Blur adjustments:** Animate backdrop-blur filters or background opacity slightly on hover (e.g., `bg-white/5` to `bg-white/10`).
- **Inner highlights:** Subtle shine sweeping diagonally across the glass panel on mount or hover.

### Sidebar Expand/Collapse Animation
- Use `layout` prop in Framer Motion to animate the width. Text elements inside should fade out rapidly before the width shrinks to prevent text wrapping glitches.

### Tab Switching Animations
- **Active Indicator:** Use Framer Motion's `layoutId="activeTab"` for an underline or rounded background pill that smoothly glides between tab items.
- **Content Crossfade:** Wrap content in `<AnimatePresence mode="wait">` fading out old content and sliding in new content.

### Modals & Dropdowns
- **Modal Entrance:** `initial={{ opacity: 0, scale: 0.95 }}` to `animate={{ opacity: 1, scale: 1 }}` using `springSmooth`.
- **Dropdowns:** Anchor to the trigger point (e.g., `origin-top-right`) and animate scaleY/opacity.

### Component-Level Motion
- **Course Card Hover:** `whileHover={{ y: -5, scale: 1.01 }}`. 
- **Notification Animations:** Slide in from right `x: 50` to `x: 0`, and bounce down for unread badges.
- **Live Class Indicator:** Standard CSS `animate-ping` for the outer radius, combined with a steady solid inner circle.
- **Progress Bars:** `initial={{ width: 0 }}` animating to `width: "X%"` over 1 second, with `easeOut`.
- **Progress Rings:** Animate the SVG `strokeDashoffset`.
- **Skeleton Loading:** `animate-pulse` or a CSS linear-gradient shimmer moving from `-100%` to `200%`.
- **Empty States:** Gentle float animation `animate={{ y: [-5, 5, -5] }}` over 4 seconds, or a slow draw-in of an SVG illustration.

---

## 5. Feature-Specific Choreography

### Student Dashboard
- **Course cards:** Enter with a staggered fade-up.
- **Continue learning card:** Features a subtle, slow-moving glowing gradient on its border to draw attention.
- **Upcoming live class card:** A red recording dot pulses `animate-ping` infinitely.
- **Assignment cards:** Slide in sequentially based on urgency (red deadlines first).
- **Progress stats:** Use a `useMotionValue` and `animate()` utility to count numbers up from 0 to target on load.

### Course Page
- **Curriculum modules:** Expand with a smooth dynamic height animation (`height: "auto"`, `overflow: "hidden"`).
- **Completed lessons:** Once marked complete, a green checkmark "draws" itself in via `pathLength` animation.
- **Active lesson:** Uses an animated gradient background behind a `<div className="glass-panel">` to create a moving border effect.
- **Course progress bar:** Fills smoothly from left to right as the user navigates into the course view.

### Video Lesson Page
- **Player controls:** Bottom glass panel fades in on mouse move, fades out (`opacity: 0`) after 3s of inactivity.
- **Sidebar (Desktop):** Slides in from the right (`x: 100%` to `x: 0`).
- **Sidebar (Mobile):** Acts as a Bottom Sheet sliding up from the bottom (`y: 100%` to `y: 0`), using drag gestures (`drag="y"`).
- **Notes panel:** Slides out gracefully pushing video content to the side (using `layout` animations on the video wrapper).
- **Transcript:** Auto-scroll smoothly highlights the active timestamp with a soft blue text color transition.
- **Next lesson card:** Popping up softly in the corner during the last 10 seconds of the video (`y: 20`, `opacity: 0` -> `y: 0`, `opacity: 1`).

### Live Class
- **Waiting room:** A glass card that floats gently in the center of the screen `y: [0, -10, 0]`.
- **Join button:** Has a soft breathing glow box-shadow `animate={{ boxShadow: ["0px 0px 0px rgba(59,130,246,0)", "0px 0px 20px rgba(59,130,246,0.5)", "0px 0px 0px rgba(59,130,246,0)"] }}`.
- **Recording indicator:** Pulses red in the top left corner.
- **Speaking participant:** The glass card of the active speaker gets a 2px animated blue border.
- **Hand raise icon:** Bounces gently `y: [0, -5, 0]` loop when triggered.
- **Chat messages:** New messages slide up from the bottom `y: 10` and `opacity: 0`.

### Admin Dashboard
- **Analytics cards:** Count-up numbers on mount.
- **Charts:** Line charts path length draw in from left to right (`pathLength: 0` to `1`).
- **Tables:** Rows reveal with a very fast stagger (`staggerChildren: 0.05`).
- **Filters:** Expand as glass dropdown panels with `scaleY: 1` from `origin-top`.
- **Storage usage ring:** Circle stroke draws around smoothly, changing color from blue to orange depending on storage limits.

---

## 6. Implementation Guidance (Framer Motion)

### Recommended Base Variants
Use these for standard staggers (e.g., lists, dashboards).

```typescript
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};
```

### Hover & Tap States
Interactive buttons and cards should feel tactile.
```tsx
<motion.button
  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
  whileTap={{ scale: 0.98 }}
>
  Join Class
</motion.button>
```

### Reduced Motion Accessibility
Respect user OS preferences to disable jarring animations. Fallback to basic opacity fades.

```tsx
import { motion, useReducedMotion } from 'motion/react';

export function AccessibleCard({ children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
```

### Success States (Micro-interactions)
For task completions, grades uploaded, or module passed.
```tsx
<motion.path
  initial={{ pathLength: 0, opacity: 0 }}
  animate={{ pathLength: 1, opacity: 1 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
  d="M5 13l4 4L19 7" // Checkmark SVG path
/>
```

---
*End of Motion Design System Document*
