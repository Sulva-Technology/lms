# VUI LMS: Full App Shell Design Specification

**Version:** 1.0.0
**Role:** Premium UI Art Director & Frontend Architect
**Aesthetic:** Premium Glassmorphism, Material You, Modern SaaS
**Scope:** Global layout wrapping all authenticated LMS experiences

This document defines the ubiquitous Application Shell for VUI LMS. It is responsible for routing, global state interactions (search, notifications), role-based access control rendering, and housing the ambient background that gives the platform its signature look.

---

## 1. Layout Structure & The Environment

### 1.1 The Ambient Canvas (Background)
*   **Base:** `bg-slate-950`
*   **Gradient System:** Fixed position, lowest z-index. A system of 3-4 massive, low-opacity, blurred radial gradients (`blur-[150px]`) that represent the "living" platform.
    *   *Student:* Blue & Emerald accents.
    *   *Lecturer:* Violet & Indigo accents.
    *   *Admin:* Emerald & Teal accents.
    *   *Super Admin:* Platinum & Blue accents.
*   **Motion:** Slow, continuous rotation and scaling via Framer Motion to create a premium breathing effect.

### 1.2 Main Layout Grid
*   **Desktop:** Flex container (`flex h-screen overflow-hidden`). Left child is Sidebar, Right child is a flex-col containing the Top Navbar and the Main Content scrollable area.
*   **Main Content Container:** `flex-1 overflow-y-auto relative z-0`. Content inside this container should be constrained to `max-w-7xl mx-auto` (unless it's a full-bleed view like the Video Player or Live Class).

---

## 2. Navigation Architecture

### 2.1 The Sidebar (Desktop)
*   **Aesthetic:** `w-64 bg-slate-900/50 backdrop-blur-3xl border-r border-white/5 flex flex-col transition-all duration-300`.
*   **Header:** VUI Logo + Context (Current University).
*   **Nav Items:** Dense, highly readable list. Active items have a `bg-white/10` background and a colored left border corresponding to the user's role.
*   **Collapse State:** Reduces to `w-20`. Icons only. Tooltips appear on hover.

### 2.2 Top Navigation Bar (Header)
*   **Aesthetic:** `sticky top-0 z-40 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 h-16 px-6 flex items-center justify-between`.
*   **Left Component:** Dynamic Breadcrumbs (e.g., `Home / Computer Science / CSC 301`). Slanted separators `/` in `text-slate-600`.
*   **Center Component:** Global Command Search input (disabled visual state, clicking opens the Command Palette).
*   **Right Component:** University Switcher (if applicable), Notification Bell, User Avatar dropdown.

### 2.3 Mobile Navigation
*   **Structure:** The sidebar is completely hidden. Replaced by a floating Glass Bottom Navigation Pill for primary routes (Dashboard, Courses, Live).
*   **Secondary Routes:** A hamburger menu in the mobile Top Navbar opens a full-screen glass overlay.

---

## 3. Contextual Overlays & States

### 3.1 Global Search (Command Palette)
*   **Trigger:** `Cmd/Ctrl + K` or clicking the search bar in the Top Nav.
*   **Aesthetic:** Heavy glass modal `bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]`.
*   **Functionality:** Role-aware search. Students can search courses/assignments; Admins can search users/departments.

### 3.2 Notification Center
*   **Trigger:** Clicking the Bell icon.
*   **Aesthetic:** Glass dropdown anchoring to the top right.
*   **Items:** Unread messages have a subtle glowing dot. Hovering marks as read.

### 3.3 Role & University Switcher
*   **Trigger:** Top right avatar dropdown or top left logo area.
*   **Behavior:** For users with multiple roles (e.g., a TA who is also a Student), switching roles triggers a full page transition via Framer Motion, swapping out the navigation tree and color accents smoothly.

---

## 4. Role-Based Navigation Trees

Navigation dynamically renders based on the user's primary JWT claim or selected role.

### 4.1 Student Navigation
*   Dashboard (Home icon)
*   My Courses (Library icon)
*   Course Registration (Check-list icon)
*   Live Classes (Video icon)
*   Assignments (File-text icon)
*   Quizzes (Help-circle icon)
*   Grades (Award icon)
*   Calendar (Calendar icon)
*   Notifications (Bell icon)

### 4.2 Lecturer Navigation
*   Dashboard (Home icon)
*   My Courses (Library icon)
*   Live Classes (Video icon)
*   Recordings (Film icon)
*   Assignments (File-plus icon)
*   Quizzes (Help-circle icon)
*   Gradebook (Book-open icon)
*   Attendance (Users icon)
*   Questions (Message-circle icon)
*   Announcements (Megaphone icon)

### 4.3 Admin Navigation
*   Dashboard (Activity icon)
*   Faculties (Building icon)
*   Departments (Briefcase icon)
*   Programs (Target icon)
*   Students (Users icon)
*   Lecturers (User-check icon)
*   Courses (Book icon)
*   Registration (Clipboard-list icon)
*   Reports (Pie-chart icon)
*   Storage (Hard-drive icon)
*   Settings (Settings icon)
*   Audit Logs (List icon)

### 4.4 Super Admin Navigation
*   Platform Overview (Globe icon)
*   Universities (Landmark icon)
*   Plans (Credit-card icon)
*   Billing (Dollar-sign icon)
*   Usage (Trending-up icon)
*   Support (Life-buoy icon)
*   System Settings (Sliders icon)

---

## 5. Animation & Framer Motion Guidelines

*   **Role Switch & Initial Load:**
    *   The Main Content container uses AnimatePresence with `mode="wait"`. Transitions map to `opacity: 0, y: 10` to `opacity: 1, y: 0`.
*   **Sidebar Toggle:**
    *   Uses Framer Motion's `layout` prop to smoothly animate between `w-64` and `w-20` without text clipping (text fades out before the width shrinks).
*   **Link Hover:**
    *   Active Background Pill uses `layoutId="active-nav-pill"` to physically slide between menu items when clicked, providing instant spatial awareness.
*   **Loading State:**
    *   Next.js 15 `loading.tsx` inside the dashboard shell renders a skeleton replica of the target page wrapper to prevent layout shift.

---

## 6. Suggested Tailwind Component Structure

```text
app/
 └─ (system)/
     └─ app-shell/
         ├─ layout.tsx (Server Component: Fetches user role & tree)
         ├─ components/
         │   ├─ AnimatedBackground.tsx
         │   ├─ Sidebar/
         │   │   ├─ DesktopSidebar.tsx
         │   │   ├─ NavItem.tsx
         │   │   └─ NavTreeRenderer.tsx (Builds tree based on role)
         │   ├─ TopNav/
         │   │   ├─ Header.tsx
         │   │   ├─ Breadcrumbs.tsx
         │   │   ├─ GlobalSearchTrigger.tsx
         │   │   ├─ NotificationBell.tsx
         │   │   └─ UserMenuDropdown.tsx
         │   ├─ Mobile/
         │   │   ├─ BottomNavigationPill.tsx
         │   │   └─ FullscreenMenuOverlay.tsx
         │   └─ Modals/
         │       └─ CommandPalette.tsx
```

This application shell provides a silent, secure, and incredibly fluid foundation for the LMS. It gets out of the way of the content while constantly reassuring the user of their context and capabilities.
