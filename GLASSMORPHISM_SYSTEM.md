# VUI LMS Glassmorphism Visual Language

**Version:** 1.0.0
**Role:** Premium UI Art Director
**Aesthetic:** Modern, Google-inspired, Frosted Glass, Academic Premium

This document defines the exact glassmorphism parameters for VUI LMS. Glassmorphism is used here as a structural tool to communicate elevation, focus, and hierarchy—not merely as decoration. 

---

## Part 1: Component Specifications

### 1. Main App Background
*   **Background Color:** Deep Slate (`#020617`) with cyan/blue/purple mesh gradients.
*   **Opacity:** 100% (Solid base canvas)
*   **Backdrop Blur:** N/A (It's the bottom layer)
*   **Border Style:** None
*   **Shadow Style:** None
*   **Border Radius:** None
*   **Hover/Active:** N/A
*   **Dark Mode Behavior:** Base layer is very dark (`slate-950`).
*   **Accessibility:** Mesh gradients must be muted (e.g., 20% opacity) to ensure any non-glass text remains readable.

### 2. Student Dashboard Cards
*   **Background Color:** White (`#ffffff`) or Slate (`#0f172a`)
*   **Opacity:** 3% to 5% (`bg-white/5`)
*   **Backdrop Blur:** 12px (`backdrop-blur-md`)
*   **Border Style:** 1px solid, White 10% (`border-white/10`)
*   **Shadow Style:** Soft ambient shadow (`shadow-lg`)
*   **Border Radius:** 24px (`rounded-[24px]`)
*   **Hover State:** Background drops to 8% opacity, border to 15%. Gentle translation up (`-translate-y-1`).
*   **Active State:** Quick scale down (`scale-95`).
*   **Dark Mode Behavior:** Uses white opacity to brighten the dark background.
*   **Accessibility:** Highly contrasted text (`text-slate-50`) required.

### 3. Lecturer Dashboard Cards
*   **Background Color:** White with Violet tint
*   **Opacity:** 5% (`bg-white/5`)
*   **Backdrop Blur:** 12px (`backdrop-blur-md`)
*   **Border Style:** 1px solid, Violet tinted (`border-violet-500/20`)
*   **Shadow Style:** `shadow-xl`
*   **Border Radius:** 24px (`rounded-[24px]`)
*   **Hover/Active:** Same structural behavior as student cards, but uses violet glows.
*   **Dark Mode Behavior:** Base card glassmorphism.
*   **Accessibility:** Ensure active violet borders meet minimum contrast ratios.

### 4. Admin Analytics Cards
*   *Note: Heavy data requires clarity.*
*   **Background Color:** Dark Slate (`#0f172a`)
*   **Opacity:** 40% (`bg-slate-900/40`) - much less transparent.
*   **Backdrop Blur:** 8px (`backdrop-blur-sm`)
*   **Border Style:** 1px solid, Slate 800 (`border-slate-800`)
*   **Shadow Style:** Minimal (`shadow-none` or `shadow-sm`)
*   **Border Radius:** 16px (`rounded-2xl`)
*   **Hover/Active:** Subtle background lightening (`bg-slate-800/60`).
*   **Dark Mode Behavior:** Almost solid.
*   **Accessibility:** Prioritize legibility of numbers and charts over glass aesthetics.

### 5. Course Cards
*   **Background Color:** White
*   **Opacity:** 5% (`bg-white/5`)
*   **Backdrop Blur:** 16px (`backdrop-blur-md`)
*   **Border Style:** 1px solid White 10% (`border-white/10`)
*   **Shadow Style:** Deep glow on hover (`shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)]`)
*   **Border Radius:** 24px (`rounded-[24px]`)
*   **Hover State:** Scale image inside, border becomes 20% opacity.
*   **Active State:** Scale down 1%.
*   **Dark Mode Behavior:** Standard glass.
*   **Accessibility:** Focus rings must encircle the entire card.

### 6. Video Player Overlay Controls
*   **Background Color:** True Black (`#000000`)
*   **Opacity:** 40% (`bg-black/40`)
*   **Backdrop Blur:** 24px (`backdrop-blur-xl`) — Heavy blur to mask moving video.
*   **Border Style:** 1px solid White 5% (`border-white/5`)
*   **Shadow Style:** `shadow-2xl`
*   **Border Radius:** Pill (`rounded-full`) or disconnected floating bar (`rounded-2xl`)
*   **Hover State:** Opacity jumps to 60% (`bg-black/60`).
*   **Active State:** Immediate snap response.
*   **Dark Mode Behavior:** Always dark, even in light mode, as it sits over video.
*   **Accessibility:** High-contrast white iconography only.

### 7. Live Class Controls
*   **Background Color:** Slate 950 (`#020617`)
*   **Opacity:** 60% (`bg-slate-950/60`)
*   **Backdrop Blur:** 40px (`backdrop-blur-2xl`) 
*   **Border Style:** 1px solid White 10%
*   **Shadow Style:** Heavy drop shadow `shadow-[0_20px_50px_rgba(0,0,0,0.5)]`
*   **Border Radius:** Pill (`rounded-full`)
*   **Hover/Active:** Individual buttons inside the pill have hover states. Main glass pill remains static.
*   **Dark Mode Behavior:** Deeply frosted.
*   **Accessibility:** Buttons must have clear isolated tooltips.

### 8. Floating Sidebars
*   **Background Color:** Slate 900 (`#0f172a`)
*   **Opacity:** 80% (`bg-slate-900/80`)
*   **Backdrop Blur:** 24px (`backdrop-blur-xl`)
*   **Border Style:** Right border only, White 5% (`border-r border-white/5`)
*   **Shadow Style:** Right-facing soft shadow
*   **Border Radius:** 0px (edge-to-edge) or 24px if truly floating.
*   **Hover/Active:** N/A (Structural element)
*   **Dark Mode Behavior:** Behaves essentially as a solid container but allows ambient blobs to slightly leak through.
*   **Accessibility:** Too much transparency behind text-heavy navigation causes cognitive load. Keep opacity high (80%+).

### 9. Modals (Dialogs)
*   **Background Color:** Slate 900 (`#0f172a`)
*   **Opacity:** 60% (`bg-slate-900/60`)
*   **Backdrop Blur:** 24px (`backdrop-blur-xl`); Plus a whole-page overlay blur (`backdrop-blur-sm`).
*   **Border Style:** 1px solid White 10% plus an inner top highlight.
*   **Shadow Style:** Intense shadow (`shadow-2xl shadow-black/50`)
*   **Border Radius:** 24px (`rounded-[24px]`)
*   **Hover/Active:** N/A
*   **Dark Mode Behavior:** Deep contrast to separate from dashboard.
*   **Accessibility:** Trap focus. Escape key unmounts. Underlay (the page) must be explicitly dimmed.

### 10. Dropdowns & 11. Command Palette
*   **Background Color:** Slate 800 (`#1e293b`)
*   **Opacity:** 70% (`bg-slate-800/70`)
*   **Backdrop Blur:** 24px (`backdrop-blur-xl`)
*   **Border Style:** 1px solid Slate 700 (`border-slate-700`)
*   **Shadow Style:** `shadow-xl`
*   **Border Radius:** 16px (`rounded-2xl`)
*   **Hover/Active:** Individual items get `bg-white/10`.
*   **Focus/Dark Mode:** Maintain high contrast for search text.

### 12. Notification Panel
*   **Background Color:** Slate 900
*   **Opacity:** 80% (`bg-slate-900/80`)
*   **Backdrop Blur:** 24px (`backdrop-blur-xl`)
*   **Border Style:** 1px solid White 10% (`border-white/10`)
*   **Shadow Style:** `shadow-2xl`
*   **Border Radius:** 24px (`rounded-2xl`)
*   **Hover/Active:** Interactive list inside.
*   **Accessibility:** Scrollable area must be obvious.

### 13. Mobile Bottom Sheets
*   **Background Color:** Slate 950
*   **Opacity:** 70% (`bg-slate-950/70`)
*   **Backdrop Blur:** 40px (`backdrop-blur-2xl`)
*   **Border Style:** 1px solid Top White 10% (`border-t border-white/10`)
*   **Shadow Style:** Upward shadow `shadow-[0_-10px_40px_rgba(0,0,0,0.3)]`
*   **Border Radius:** Top left/right 24px (`rounded-t-[24px]`)
*   **Accessibility:** Include a highly visible grab handle (e.g., `w-12 h-1.5 bg-slate-600 rounded-full`).

### 14. Login Page & 15. Landing Page Hero
*   *Uses the heaviest "Frost" to drive extreme focus.*
*   **Background Color:** White
*   **Opacity:** 3% (`bg-white/[0.03]`)
*   **Backdrop Blur:** 40px (`backdrop-blur-2xl`)
*   **Border Style:** 1px solid White 20% (`border-white/20`) - High reflection edge.
*   **Shadow Style:** Extravagant glow.
*   **Border Radius:** 32px (`rounded-[32px]`)
*   **Accessibility:** Text within the hero glass must be large (`text-5xl`) and high-contrast (`text-white`).

---

## Part 2: Tailwind CSS Examples

### 1. Glass Card (Standard)
```tsx
<div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] p-6 shadow-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
  <h3 className="text-white font-semibold text-lg">Standard Card</h3>
  <p className="text-slate-400 text-sm mt-2">Perfect for dashboard widgets.</p>
</div>
```

### 2. Glass Sidebar (Heavy Frost)
```tsx
<aside className="w-64 h-screen fixed left-0 top-0 bg-slate-900/60 backdrop-blur-2xl border-r border-white/10 z-50 flex flex-col">
  {/* Content */}
</aside>
```

### 3. Glass Modal (High Elevation)
```tsx
{/* Underlay */}
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
 {/* Modal Window */}
  <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[24px] w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] p-8 relative overflow-hidden">
    {/* Inner top highlight */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    <h2 className="text-2xl text-white font-outfit font-semibold">Important Action</h2>
  </div>
</div>
```

### 4. Glass Course Card (Interactive)
```tsx
<div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] overflow-hidden cursor-pointer hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)] transition-all duration-300">
  <div className="h-48 bg-slate-800 relative overflow-hidden">
    {/* Image placeholder */}
    <img src="..." className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors" />
  </div>
  <div className="p-6">
    <h3 className="text-white font-outfit font-medium text-xl">Course Title</h3>
  </div>
</div>
```

### 5. Glass Live Class Control Bar (Floating Pill)
```tsx
<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
  <button className="p-3 rounded-full hover:bg-white/10 text-white transition-colors">
    <Mic size={20} />
  </button>
  <button className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20">
    <Phone size={20} />
  </button>
</div>
```

### 6. Glass Notification Dropdown
```tsx
<div className="absolute top-16 right-6 w-80 bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4 origin-top-right z-50">
  <h4 className="text-sm font-semibold text-slate-200 mb-3 px-2">Notifications</h4>
  <div className="space-y-1">
    <div className="p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
      <p className="text-sm text-white">Assignment Graded</p>
    </div>
  </div>
</div>
```

### 7. Glass Mobile Bottom Sheet
```tsx
<div className="fixed inset-x-0 bottom-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] transform transition-transform duration-500 translate-y-0">
  {/* Grab Handle */}
  <div className="w-12 h-1.5 bg-slate-600/50 rounded-full mx-auto mb-6"></div>
  <h2 className="text-xl text-white font-semibold">Options</h2>
</div>
```
