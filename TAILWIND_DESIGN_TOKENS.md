# Sulva LMS: Tailwind CSS Design Tokens & Utility Patterns

**Version:** 1.0.0
**Role:** Senior Frontend UI Engineer
**Aesthetic:** Google Material You, Premium Glassmorphism, SaaS Learning

This document provides the raw Tailwind CSS utility patterns and custom design tokens for Sulva LMS. It acts as the styling dictionary for all components. 

*Note: As Sulva LMS uses a dark-first, highly immersive aesthetic, "Dark Mode" is the default structural paradigm, augmented by brilliant lighting and glass effects.*

---

## 1. Tailwind v4 Theme Configuration (`globals.css`)

In Tailwind v4, custom tokens are defined using CSS variables and the `@theme` directive directly in the global CSS file.

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-slate-950: #020617; /* Deep base */
  --color-slate-900: #0f172a;
  --color-slate-800: #1e293b;
  
  --color-vui-blue-500: #3b82f6;
  --color-vui-violet-500: #8b5cf6;
  --color-vui-emerald-500: #10b981;
  --color-vui-teal-400: #2dd4bf;

  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-outfit: 'Outfit', sans-serif; /* For premium headings */

  /* Glowing Shadows */
  --shadow-glow-blue: 0 0 20px rgba(59, 130, 246, 0.3);
  --shadow-glow-violet: 0 0 20px rgba(139, 92, 246, 0.3);
  --shadow-glow-red: 0 0 20px rgba(239, 68, 68, 0.3);

  /* Custom Blur Levels */
  --blur-ambient: 120px;
}

/* Base resets & utilities */
@layer base {
  body {
    @apply bg-slate-950 text-slate-50 font-sans antialiased selection:bg-blue-500/30 selection:text-white;
  }
}
```

---

## 2. Structural & Layout Classes

### 2.1 Background Gradients (The Ambient Mesh)
Applied to a fixed bottom div or the `body` itself to create the "living" background.
```html
<!-- Ambient Blobs Container -->
<div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
  <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
  <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/15 blur-[120px] rounded-full mix-blend-screen"></div>
</div>
```

### 2.2 Solid Admin Table Surface
Admin tables must prioritize legibility over aesthetic blur.
**Classes:** `bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl`
**Sticky Header:** `bg-slate-950 text-slate-400 text-sm font-medium border-b border-slate-800`

---

## 3. Glassmorphism Patterns

### 3.1 Glass Dashboard Card (Base)
**Classes:** `bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] shadow-xl p-6`

### 3.2 Glass Course Card (Interactive)
**Classes:** `group bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] overflow-hidden shadow-lg hover:shadow-glow-blue hover:-translate-y-1 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300`

### 3.3 Glass Navbar (Top Navigation)
**Classes:** `sticky top-0 z-40 bg-slate-950/60 backdrop-blur-xl border-b border-white/5`

### 3.4 Glass Sidebar
**Classes:** `fixed inset-y-0 left-0 z-30 w-64 bg-slate-900/60 backdrop-blur-2xl border-r border-white/10`

### 3.5 Glass Modal & Dropdown (Heavy Frost)
Used for intense focus, requiring heavy blur to hide background context.
**Modal Overlay:** `fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center`
**Modal Card:** `bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] p-8`
**Dropdown:** `absolute mt-2 right-0 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl`

### 3.6 Live Class Control Bar (Floating Pill)
**Classes:** `fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4`

---

## 4. Controls & Buttons

### 4.1 Premium Solid Button (Primary Action)
**Classes:** `bg-white text-slate-900 hover:bg-slate-200 font-medium rounded-full px-6 py-2.5 shadow-lg active:scale-95 transition-all focus:ring-2 focus:ring-white/50 focus:outline-none`

### 4.2 Gradient Button (Marketing / Registration)
**Classes:** `bg-gradient-to-r from-vui-blue-500 to-vui-violet-500 text-white font-medium rounded-full px-6 py-2.5 shadow-glow-blue hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 active:scale-95 transition-all`

### 4.3 Ghost/Glass Button (Secondary Action)
**Classes:** `bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-full px-5 py-2 transition-colors focus:ring-2 focus:ring-white/20`

### 4.4 Icon Button
**Classes:** `p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors`

---

## 5. Forms & Inputs

### 5.1 Form Input
**Classes:** `w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-vui-blue-500 focus:ring-1 focus:ring-vui-blue-500/50 transition-all shadow-inner`

### 5.2 Form Label
**Classes:** `block text-sm font-medium text-slate-300 mb-1.5`

### 5.3 Video Upload Dropzone
**Classes:** `border-2 border-dashed border-slate-700 bg-slate-900/20 rounded-2xl flex flex-col items-center justify-center p-12 hover:border-vui-blue-500/50 hover:bg-vui-blue-500/5 transition-colors cursor-pointer group`

---

## 6. Feedback & Indicators

### 6.1 Status Badges
**Base Classes:** `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`
*   **Active/Success (Emerald):** `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
*   **Pending/Warning (Orange):** `bg-orange-500/10 text-orange-400 border border-orange-500/20`
*   **Inactive/Draft (Slate):** `bg-slate-800 text-slate-300 border border-slate-700`
*   **Lecturer/Special (Violet):** `bg-violet-500/10 text-violet-400 border border-violet-500/20`

### 6.2 Progress Bar
*   **Track:** `w-full h-2 bg-slate-800 rounded-full overflow-hidden`
*   **Fill (Gradient):** `h-full bg-gradient-to-r from-vui-blue-500 to-vui-emerald-500 rounded-full`

### 6.3 Progress Ring (SVG)
Using SVG `circle`:
*   **Background Circle:** `stroke-slate-800 fill-transparent`
*   **Progress Circle:** `stroke-vui-blue-500 fill-transparent transition-all duration-1000 ease-out`

---

## 7. Responsive & Interactive States

### 7.1 Hover & Active Transforms
Always pair translation with scale and shadow changes to emulate physicality.
`hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl active:translate-y-0 active:scale-95 transition-all duration-200`

### 7.2 Mobile Considerations
When scaling down below `md:` (768px):
*   Reduce border radii on massive cards from `rounded-[32px]` to `rounded-[24px]` to save space.
*   Change sidebars to heavy-glass bottom sheets `fixed inset-x-0 bottom-0 rounded-t-[32px]`.

---

## 8. Accessibility Notes

1.  **Contrast on Glass:** Text sitting on glass panels must be `text-white` or `text-slate-200`. Avoid medium greys (`slate-500`) against a blurred backdrop as the shifting colors behind the glass can unpredictably cause WCAG contrast failures.
2.  **Focus States:** Never rely solely on color. Every interactive element must use `focus:ring-2` to outline the element.
3.  **Reduced Motion:** Ensure structural animations respect the user's OS settings. Use Tailwind's native `motion-reduce:` pseudo-class. Example: `transition-all duration-300 motion-reduce:transition-none motion-reduce:transform-none`.
4.  **Semantic HTML:** Tailwind paints the picture, but buttons must be `<button>`, modals must be `dialog` or use ARIA roles, and inputs must have associated `<label>`s.
