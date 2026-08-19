# Sulva LMS: Reusable Component Library Specification

**Version:** 1.0.0
**Aesthetic:** Premium Glassmorphism, Material You Softness, Udemy-quality Learning

This document defines the comprehensive reusable component library for Sulva LMS. It serves as the single source of truth for frontend implementation, ensuring consistency across all roles (Student, Lecturer, Admin) and interfaces.

---

## 1. Navigation Components

### 1.1 App Shell
*   **Purpose:** The master container for all authenticated views. Manages the responsive grid.
*   **Styles:** `bg-slate-950 flex h-screen overflow-hidden text-slate-50 relative`. Includes base ambient gradient blobs on the bottom layer.
*   **Variants:** Standard (Navigation visible), Focus Mode (Navigation hidden, e.g., Video Player, Live Class).
*   **Animation:** Background blobs rotate infinitely over 20s.

### 1.2 Sidebar
*   **Purpose:** Primary structural navigation for Desktop.
*   **Styles:** `w-64 h-full bg-slate-900/60 backdrop-blur-2xl border-r border-white/10 z-30 transition-all`.
*   **Variants:** Full Width (250px), Collapsed (80px, icons only).
*   **Active Item:** Uses Framer Motion `layoutId="sidebar-active"` for a shifting pill highlight `bg-blue-600/10`.

### 1.3 Top Navbar
*   **Purpose:** Secondary navigation, profile access, and global search.
*   **Styles:** `h-20 w-full sticky top-0 z-40 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6`.

### 1.4 Mobile Bottom Navigation
*   **Purpose:** Primary navigation for devices < 768px.
*   **Styles:** `fixed bottom-6 left-6 right-6 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-full py-3 px-6 shadow-2xl flex justify-between z-40`.
*   **States:** Active icons apply `text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]`.

### 1.5 Command Palette
*   **Purpose:** Global power-user search (`Cmd + K`).
*   **Styles:** Large overlay. Input: `text-2xl font-outfit bg-transparent`. Results: List of glass items.
*   **Animation:** `initial={{ scale: 0.95, opacity: 0 }}` spring entrance.

---

## 2. Card Components

### 2.1 Glass Dashboard Card (Base)
*   **Purpose:** The foundation for most dashboard widgets.
*   **Styles:** `bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] shadow-xl p-6 relative overflow-hidden`.
*   **Variants:** Interactive (adds hover state), Accent (adds a coloured blur orb in the corner).
*   **Hover State:** `hover:-translate-y-1 hover:bg-white/[0.08] transition-all`.

### 2.2 Course Card (Udemy-style)
*   **Purpose:** Displaying available or registered courses.
*   **Styles:** Top 50% image, bottom 50% details. 
*   **Animation:** Hovering triggers `scale-105` on the image and fades in a center Play icon.

### 2.3 Live Class Card (Urgency)
*   **Purpose:** Highlighting an upcoming or ongoing live session.
*   **Styles:** Dense glass `bg-slate-800/80`.
*   **Variants:** "Starting Soon" (Orange accent border), "Live Now" (Red accent border + pulsing dot).

### 2.4 Assignment Card
*   **Purpose:** To-do items for students, grading tasks for lecturers.
*   **Styles:** Horizontal list item. `border-l-[3px] border-l-blue-500 rounded-xl p-4`.

### 2.5 Analytics Chart Card
*   **Purpose:** Admin and Lecturer data visualisations.
*   **Styles:** Solid glass `bg-slate-900/60`. Top header for controls, bottom area for the Recharts component.

---

## 3. Learning Components

### 3.1 Course Module Accordion
*   **Purpose:** Grouping lessons in the curriculum.
*   **Styles:** Header: `bg-white/5 py-4 px-6 cursor-pointer`. Body: `bg-slate-900/40`.
*   **Animation:** `height: auto` vs `height: 0` controlled by Framer Motion. Arrow rotates 180deg.

### 3.2 Lesson Item
*   **Purpose:** Individual video or resource link.
*   **Styles:** `flex items-center gap-4 py-3 px-4 hover:bg-white/5 rounded-lg`.
*   **States:** Locked (opacity 50%), Completed (Green Check).

### 3.3 Transcript Panel
*   **Purpose:** Written text accompanying video.
*   **Styles:** Scrollable area. Text is `text-slate-400`.
*   **States:** Active text line becomes `text-white font-medium` via timestamp syncing.

### 3.4 Progress Ring
*   **Purpose:** Visual completion feedback.
*   **Styles:** SVG circle. Stroke `text-slate-800`, Fill `text-blue-500`.
*   **Animation:** `strokeDashoffset` animates from circumference to current value over 1.5s.

---

## 4. Live Class Components

### 4.1 Floating Control Bar
*   **Purpose:** Primary class actions (Mic, Cam, Leave).
*   **Styles:** `fixed bottom-8 bg-slate-950/80 backdrop-blur-2xl rounded-full border border-white/10 px-6 py-3 flex gap-4`.
*   **Animation:** Fades out after 3s of mouse inactivity.

### 4.2 Participant Tile
*   **Purpose:** Video feed container.
*   **Styles:** `bg-black rounded-xl overflow-hidden relative border border-slate-800`.
*   **States:** Active Speaker (`border-blue-500 shadow-glow`), Hand Raised (Yellow icon top right).

### 4.3 Chat Panel
*   **Purpose:** Sidebar communication.
*   **Styles:** `bg-slate-900/90 backdrop-blur-xl`.
*   **Messages:** Slide up `y: 10` on entry.

---

## 5. Form Components

### 5.1 Text Input & Search
*   **Purpose:** Standard data entry.
*   **Styles:** `bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-500`.
*   **States:** Focus (`focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500`).

### 5.2 Select Dropdown (Glass)
*   **Styles:** Trigger looks like input. Dropdown body uses Heavy Glass (`bg-slate-800/90 backdrop-blur-xl shadow-2xl`).

### 5.3 Video Upload Dropzone
*   **Purpose:** Course creation.
*   **Styles:** `border-2 border-dashed border-slate-700 bg-slate-900/20 rounded-2xl flex flex-col items-center justify-center p-12 hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors`.

---

## 6. Admin Components

### 6.1 Data Table (Solid)
*   **Purpose:** Mass data view (Students, Courses).
*   **Styles:** Specifically avoiding complex glassmorphism here. `bg-slate-900/95 border border-slate-800 rounded-xl`. Sticky header row `bg-slate-950`.

### 6.2 Status & Role Badges
*   **Purpose:** Quick visual categorisation.
*   **Styles:** Small pill `px-2.5 py-0.5 text-xs font-medium rounded-full`.
*   **Variants:** 
    *   Active/Success: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
    *   Setup/Lecturer: `bg-violet-500/10 text-violet-400`
    *   Admin: `bg-teal-500/10 text-teal-400`

### 6.3 Bulk Action Bar
*   **Purpose:** Multi-selection operations.
*   **Styles:** Floating pill at bottom. `initial={{ y: 100 }}` animating up when checkboxes > 0.

---

## 7. Feedback & State Components

### 7.1 Modal
*   **Purpose:** Forced interaction overlay.
*   **Styles:** `fixed inset-0 z-50 bg-black/40 backdrop-blur-sm`. Inner card is Heavy Glass `bg-slate-900/70 border border-white/10 shadow-2xl`.

### 7.2 Toast
*   **Purpose:** Temporary system message.
*   **Styles:** `fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl flex gap-3`. Slide-in from right.

### 7.3 Empty State
*   **Purpose:** When no data is available.
*   **Styles:** Centered vertically/horizontally. Large 20% opacity icon. Muted text text-slate-500. Gentle float animation.

### 7.4 Loading Skeleton
*   **Purpose:** Pre-loading placeholders.
*   **Styles:** `animate-pulse bg-slate-800/50`. Must match the border radius of the final component it replaces.
