# VUI LMS: Video Lesson Player Design Specification

**Version:** 1.0.0
**Role:** Premium UI Art Director & Frontend Architect
**Aesthetic:** Dark Immersive, Premium Udemy UX, Glassmorphism Overlays

This document specifies the highly focused, immersive video learning interface for VUI LMS. The goal is a distraction-free environment that retains all necessary academic tools (transcripts, notes, curriculum) accessible via fluid, animated glass panels.

---

## 1. Layout Architecture

### 1.1 Desktop Layout (≥ 1280px)
*   **Mode:** Theater by default.
*   **Video Container (Left/Center):** Occupies the primary space (approx. 70-75% width). Edge-to-edge dark container.
*   **Curriculum Sidebar (Right, `w-96`):** Fixed width, full height glass panel. Snaps to the right edge. Can be toggled open/closed.
*   **Bottom Meta Section:** When scrolling down below the video, a tabbed area appears for Overview, Q&A, Notes, Transcript, Resources.

### 1.2 Mobile Layout (< 768px)
*   **Mode:** Stacked.
*   **Video Container:** Sticky at top of the viewport (`sticky top-0 z-50`). 16:9 aspect ratio.
*   **Bottom Content:** Scrollable under the video.
*   **Curriculum:** Opens as a mobile Bottom Sheet (Drawer) using drag gestures (`drag="y"` in Framer Motion).

---

## 2. Component Designs

### 2.1 Video Player Area
*   **Background:** True Black (`#000000`).
*   **Watermarking:** Extremely subtle repeating text diagonally across the video (e.g., "CSC301 - Alex Morgan - 2026"), opacity 3%.
*   **Top Bar (Overlay):** Appears on hover. Back arrow to course, Lesson Title, "Mark Complete" toggle.

### 2.2 Control Bar Design (Overlay)
*   **Aesthetic:** Floating pill or heavy glass bar at the bottom. `bg-black/60 backdrop-blur-2xl border-t border-white/10`.
*   **Left Controls:** Play/Pause, Volume slider (+ mute), Time indicator (e.g., `12:04 / 45:00`).
*   **Right Controls:** 
    *   Playback Speed (`1x`, `1.5x`, `2x`).
    *   Captions (CC toggle).
    *   Settings (Quality, Download permissions if allowed by instructor).
    *   Picture-in-Picture (PiP).
    *   Fullscreen.
*   **Timeline Scrubber:** Smooth gradient progress bar (`bg-gradient-to-r from-blue-500 to-purple-500`). Hovering over the scrubber shows a glass thumbnail preview.

### 2.3 Curriculum Sidebar
*   **Container:** `bg-slate-900/80 backdrop-blur-3xl border-l border-white/10`.
*   **Header:** "Course Content", Close Sidebar button (`X` icon).
*   **Module Accordions:** Similar to the main course page but tighter padding.
*   **Lesson Target (Active):** The currently playing lesson is highlighted.
    *   `bg-blue-900/30 border-l-2 border-blue-500`.
    *   A tiny animated equalizer icon (3 vertical bars pulsing) replaces the play icon.
*   **Completed Lesson:** Green checkmark icon.

### 2.4 Tabbed Lower Content Area (Below Video)
*   **Navigation:** Clean text tabs with a sliding active border (`layoutId="player-tabs"`).
*   **Transcript Tab:** 
    *   Auto-scrolling view.
    *   **Active Line:** The sentence currently being spoken is highlighted `text-white font-medium`, while others are `text-slate-500`.
*   **Notes Tab (Timestamped):** 
    *   "Add Note at 12:04" input box.
    *   Pressing 'Enter' saves the note with a clickable timestamp badge.
*   **Q&A/Comments Tab:** Infinite scroll thread of questions. Mentions of `@Lecturer` are highlighted.
*   **Resources Tab:** Downloadable assets (PDFs, ZIPs) styled as glass pills.

### 2.5 Next Lesson Overlay
*   **Trigger:** Appears during the last 10 seconds of playback or when the video finishes.
*   **Aesthetic:** Glass card sliding up in the bottom-right corner of the video player.
*   **Content:** "Up Next: [Lesson Title]", Countdown ring (10s), "Play Now" and "Cancel" buttons.

---

## 3. Empty & Edge States

### 3.1 Network Error State
*   **Visual:** Video area darkens. Center glass modal `bg-slate-900/80`. 
*   **Icon:** Wi-Fi off icon. 
*   **Text:** "Connection lost. Reconnecting..." with a subtle spinning loader.

### 3.2 Video Processing State
*   **Visual:** "Video is currently processing and will be available soon."
*   **Fallback:** If an audio stream or transcript is ready early, allow falling back to those.

### 3.3 Permission Denied State
*   **Visual:** Red-tinted glass lock icon. 
*   **Text:** "You must complete the prerequisite module to access this lesson." 
*   **Action:** Primary button to navigate to the required module.

### 3.4 Download Permission
*   Configured by Lecturer. If disabled, the download button is completely hidden from the control bar (not just greyed out, to avoid frustration).

---

## 4. Animation & Framer Motion Details

*   **Player Controls Fade:** 
    *   Framer Motion wrapper around the control bar: `initial={{ opacity: 0, y: 20 }}`.
    *   Triggered `animate={{ opacity: isMouseMoving ? 1 : 0, y: isMouseMoving ? 0 : 20 }}`.
    *   Timeout set to 3000ms to hide.
*   **Sidebar Slide:**
    *   `initial={{ x: '100%' }} animate={{ x: isSidebarOpen ? 0 : '100%' }} transition={{ type: 'spring', damping: 25 }}`.
    *   When sidebar closes, the video container smoothly expands to fill the space.
*   **Next Lesson Overlay Entrance:**
    *   `initial={{ y: 50, opacity: 0 }}` -> `animate={{ y: 0, opacity: 1 }}` string physics.
*   **Mark Complete Checkmark:**
    *   When clicked, a glowing green checkmark path draws itself in `duration: 0.4`.

---

## 5. Tailwind Component Structure Suggestion

```text
app/
 └─ (dashboard)/
     └─ lesson/
         └─ [lessonId]/
             ├─ page.tsx (Layout Shell)
             ├─ components/
             │   ├─ VideoWorkspace.tsx (Grid manager for Player + Sidebar)
             │   ├─ player/
             │   │   ├─ VideoContainer.tsx (The actual HTML5/HLS player root)
             │   │   ├─ ControlBarOverlay.tsx (Play, Seek, Volume)
             │   │   ├─ TopOverlay.tsx (Title, Back, Mark Complete)
             │   │   └─ UpNextOverlay.tsx 
             │   ├─ sidebar/
             │   │   ├─ CurriculumDrawer.tsx
             │   │   └─ ActiveLessonItem.tsx
             │   └─ below-fold/
             │       ├─ PlayerTabs.tsx
             │       ├─ TranscriptView.tsx (with auto-scroll refs)
             │       ├─ TimestampedNotes.tsx
             │       └─ QAndAThread.tsx
```

This immersive design ensures that the focus remains entirely on the learning material, with high-end structural glass providing navigation context only when needed.
