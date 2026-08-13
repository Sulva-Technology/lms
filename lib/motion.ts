import type { Variants } from "motion/react";

// Standard Transitions
export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const easeOutTransition = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

// Container Variants for Staggering
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const fastStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Fade Variants
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: easeOutTransition 
  },
  exit: { 
    opacity: 0, 
    y: 10, 
    transition: { duration: 0.2 } 
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Slide Variants
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: easeOutTransition },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: easeOutTransition },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

// Scale / Modal Variants
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: springTransition 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.2 } 
  },
};

// Accordion / Dropdown Variants
export const collapseVariant: Variants = {
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  visible: { height: "auto", opacity: 1, transition: easeOutTransition },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } }
};

// Micro-interactions (Hover/Tap)
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const tapScale = {
  scale: 0.98,
};

export const hoverLift = {
  y: -2,
  transition: { duration: 0.2 },
};

// Decorative
export const pulseVariant: Variants = {
  initial: { opacity: 0.8, scale: 1 },
  animate: {
    opacity: [0.8, 1, 0.8],
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const shimmerVariant: Variants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear",
    },
  },
};

// Use this hook for reducing motion based on user preference
export function useReducedMotionHelper() {
  // Can be implemented with strict useReducedMotion from motion/react
  return false;
}
