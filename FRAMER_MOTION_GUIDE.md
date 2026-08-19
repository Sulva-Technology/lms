# Sulva LMS: Framer Motion Implementation Guide

**Version:** 1.0.0
**Role:** Senior React Frontend Engineer & Motion Designer
**Target Framework:** React + `motion/react`
**Design Philosophy:** Premium, subtle, and fluid motion inspired by Material You and modern SaaS.

This guide provides reusable Framer Motion variants and complete implementation examples for Sulva LMS. All animations include reduced-motion fallbacks for accessibility.

---

## Animation Configuration & Utilities

```typescript
// lib/animations.ts
import { Variants } from 'motion/react';

// Common Easing Curves
export const easeSoft = [0.16, 1, 0.3, 1]; // Premium, soft ease-out
export const easeSnappy = [0.4, 0, 0.2, 1]; // Quick, responsive
export const springSmooth = { type: 'spring', stiffness: 300, damping: 30 };
export const springBouncy = { type: 'spring', stiffness: 400, damping: 25 };
```

---

## 1. Page Transition
*   **Use Case:** Navigating between major dashboard views.
*   **Variant:**
```typescript
export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeSoft } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: easeSoft } }
};
```
*   **Fallback:** `y: 0`
*   **Usage:**
```tsx
import { motion } from 'motion/react';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      variants={pageTransitionVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.main>
  );
}
```

## 2. Dashboard Card Stagger
*   **Use Case:** Rendering a grid of courses or widgets on page load.
*   **Variant:**
```typescript
export const staggerContainerVars: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};
export const staggerItemVars: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', ...springSmooth } }
};
```
*   **Usage:**
```tsx
<motion.div variants={staggerContainerVars} initial="hidden" animate="visible" className="grid">
  {data.map(item => (
    <motion.div key={item.id} variants={staggerItemVars}>
      <Card data={item} />
    </motion.div>
  ))}
</motion.div>
```

## 3. Fade Up & 4. Fade In
*   **Fade Up Variant:** `hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeSoft } }`
*   **Fade In Variant:** `hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } }`

## 5. Slide In Right & 6. Slide In Left
*   **Use Case:** Sidebar entries or contextual panels.
*   **Variant (Right):** `hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 }`

## 7. Mobile Bottom Sheet
*   **Use Case:** Opening menus or options on screens < 768px.
*   **Variant:**
```typescript
export const bottomSheetVariants: Variants = {
  hidden: { y: "100%", opacity: 0.5 },
  visible: { y: "0%", opacity: 1, transition: { type: "spring", stiffness: 350, damping: 35 } },
  exit: { y: "100%", opacity: 0.5, transition: { duration: 0.3, ease: easeSoft } }
};
```

## 8. Modal Overlay & 9. Modal Content
*   **Use Case:** Dialogue boxes for warnings or forms.
*   **Overlay Variant:** `hidden: { opacity: 0 }, visible: { opacity: 1 }`
*   **Content Variant:** 
```typescript
export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', ...springSmooth } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
};
```

## 10. Dropdown
*   **Use Case:** Notification menus, user profile menus.
*   **Variant:**
```typescript
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, transformOrigin: 'top right' },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.15, ease: easeSnappy } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
};
```

## 11. Sidebar Expand/Collapse
*   **Use Case:** Toggling desktop sidebar width.
*   **Usage:** Use framer motion's `layout` prop rather than strict variants to ensure inner text and widths animate fluidly.
```tsx
<motion.aside layout initial={false} animate={{ width: isOpen ? 250 : 80 }} transition={springSmooth}>
  {/* Content */}
</motion.aside>
```

## 12. Accordion Expand/Collapse
*   **Use Case:** Course curriculum modules.
*   **Variant:**
```typescript
export const accordionVariants: Variants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" },
  expanded: { height: "auto", opacity: 1, transition: { duration: 0.3, ease: easeSoft } }
};
```

## 13. Course Card Hover & 14. Button Hover/Tap
*   **Use Case:** Interactive list elements.
*   **Card Hover:** `whileHover={{ y: -6, scale: 1.01, boxShadow: "0px 15px 30px rgba(0,0,0,0.1)" }}`
*   **Button:** `whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}`

## 15. Progress Bar Fill
*   **Use Case:** Course completion indicators.
*   **Variant:**
```typescript
export const progressFillVariants = {
  hidden: { width: 0 },
  visible: (percent: number) => ({
    width: `${percent}%`,
    transition: { duration: 1, ease: easeSoft, delay: 0.2 }
  })
};
```

## 16. Count-up Stat Wrapper
*   **Use Case:** Dashboard metrics.
*   **Usage:** Requires `useMotionValue` and `animate` hook.
```tsx
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";

export function CountUp({ to }: { to: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, to, { duration: 2, ease: "easeOut" });
    return animation.stop;
  }, [to]);

  return <motion.span>{rounded}</motion.span>;
}
```

## 17. Notification & 18. Live Class Pulse
*   **Use Case:** Urgent indicators.
*   **Variant (Framer Motion):**
```typescript
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};
```
*   *(Note: Tailwind `animate-ping` is often more performant for simple CSS pulses).*

## 19. Recording Indicator
*   **Use Case:** Red dot indicating recording.
*   **Usage:** Combines a solid inner 8px circle with a `scale: [1, 2.5]`, `opacity: [0.8, 0]` outer pulsing ring.

## 20. Video Controls Fade
*   **Use Case:** Overlay controls hiding on inactivity.
*   **Variant:** `hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }`

## 21. Toast Notification
*   **Variant:** `hidden: { x: 50, opacity: 0 }, visible: { x: 0, opacity: 1, transition: { type: 'spring', ...springBouncy } }, exit: { opacity: 0, scale: 0.9 }`

## 22. Skeleton Shimmer
*   **Usage:** Standard CSS `animate-pulse` or a background position animation via Framer.

## 23. Success Check Animation
*   **Use Case:** Finishing a lesson or enrollment.
*   **Variant:** 
```typescript
export const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};
// Use on an svg <motion.path />
```

## 24. Error Shake Animation
*   **Use Case:** Wrong password forms.
*   **Variant:**
```typescript
export const shakeVariants = {
  shake: { 
    x: [-10, 10, -10, 10, -5, 5, 0], 
    transition: { duration: 0.4 } 
  }
};
```

---

## Implementing Accessibility (Reduced Motion)

In every component where significant motion is applied, use the `useReducedMotion` hook.

```tsx
import { motion, useReducedMotion } from 'motion/react';

export function AccessibleCard({ children }) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={variants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}
```

By adhering strictly to these timings and physics profiles, the Sulva LMS maintains a unified, ultra-premium feel without distracting from the academic content.
