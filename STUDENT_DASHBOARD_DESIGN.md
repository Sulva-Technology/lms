# VUI LMS: Student Dashboard Design Specification

**Version:** 1.0.0
**Role:** Premium UI Art Director & Frontend Architect
**Aesthetic:** Premium Glassmorphism, Material You Softness, Udemy-grade UX.

This document serves as the master blueprint for the VUI LMS Student Dashboard. It provides comprehensive layout structures, component details, interaction guidelines, and Tailwind CSS implementation notes necessary for immediate frontend development.

---

## 1. Layout Architecture & Responsive Grid

The dashboard uses a CSS Grid architecture that adapts seamlessly across viewports.

### 1.1 Full Desktop Layout (≥ 1280px)
- **Structure:** 3-Column Macro Grid (`grid-cols-12`).
- **Sidebar (Left):** 250px fixed width, heavy frosted glass (`col-span-2 equivalent`).
- **Main Feed (Center):** Fluid width, max 800px. Houses Hero, Continue Learning, Registered Courses, Announcements (`col-span-7`).
- **Operations Sidebar (Right):** 350px fixed width container. Houses Calendar, Upcoming Live Classes, Deadlines, Grades summary (`col-span-3`).

### 1.2 Tablet Layout (768px - 1279px)
- **Structure:** 2-Column Grid.
- **Sidebar:** Collapses to icon-only (80px width).
- **Main Feed:** Spans full remaining width up to a breakpoint, then Operations Sidebar drops below the Main Feed or stacks to a 50/50 grid depending on content priorities.
- **Widgets:** Tile into a 2x2 grid below the Continue Learning section.

### 1.3 Mobile Layout (< 768px)
- **Structure:** 1-Column vertical stack.
- **Navigation:** Bottom Navigation Bar (glassmorphism pill floating at the bottom) replaces the left sidebar. Top Topbar remains for user profile and notifications.
- **Content Order:** Hero Welcome -> Upcoming Live Class (Priority 1) -> Deadlines (Priority 2) -> Continue Learning (Horizontal scroll snap) -> Calendar -> Grades.

---

## 2. Navigation Design

### 2.1 Top Navigation Bar (Topbar)
- **Aesthetic:** Translucent sticky header. `sticky top-0 z-40 bg-slate-950/60 backdrop-blur-xl border-b border-white/5`.
- **Left:** Mobile hamburger (md:hidden) OR Breadcrumbs/Page Title (lg:flex).
- **Center:** Global Quick Search (`bg-slate-900/50 border border-slate-800 rounded-full w-96 max-w-full`).
- **Right:** Notification Bell, Streak Flame icon, User Avatar.

### 2.2 Sidebar (Desktop)
- **Aesthetic:** Floating or full-height heavy glass. `bg-slate-900/40 backdrop-blur-2xl border-r border-white/10`.
- **Active State:** Material You pill. `bg-blue-600/10 text-blue-400` with a smooth layout shift animation.

### 2.3 Bottom Navigation (Mobile)
- **Aesthetic:** Floating pill above the bottom edge. `fixed bottom-6 inset-x-6 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full border-t-white/20 px-6 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex justify-between`.

---

## 3. Core Dashboard Sections

### 3.1 Hero Welcome Section
- **Visual:** Smooth, personal, highly encouraging.
- **Content:**
  - "Welcome back, Alex!" (`font-outfit text-4xl text-white font-semibold`). First name is a subtle gradient.
  - Subtitle: "You are on a 14-day learning streak. Keep it up!"
  - Action: "Resume last lecture" small ghost button.
- **Background:** Sits naturally on the main canvas with ambient background blur blobs (`radial-gradient` acting as a spotlight).

### 3.2 Continue Learning Section
- **Layout:** High-priority horizontal carousel (mobile) or 2-column grid (desktop).
- **Card Design:**
  - `bg-white/5 backdrop-blur-md rounded-[24px] border-white/10 hover:-translate-y-1 hover:shadow-glow`.
  - **Thumbnail:** 16:9 40% height, dark overlay.
  - **Body:** Course Title, Instructor.
  - **Progress:** Animated gradient bar `bg-gradient-to-r from-blue-500 to-purple-500`.
  - **Hover:** Center play button fades in.

### 3.3 Upcoming Live Class Card (Urgency Widget)
- **Status:** If a class is starting within 30 minutes, this widget dominates the top-right sidebar.
- **Visual:** Heavy border glow. `border border-red-500/30 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.15)]`.
- **Indicators:**
  - Pulsing recording dot: `animate-ping bg-red-500 w-3 h-3 absolute`.
- **CTA:** Primary Button "Join Class" (`bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 rounded-full`).

### 3.4 Assignment Deadline Section
- **Aesthetic:** Clean, minimalist vertical list.
- **Item Component:** Glass pill `bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center group hover:bg-white/5`.
- **Color Coding:**
  - Today: Red text/badge.
  - 3 Days: Orange text/badge.
  - > 1 Week: Slate text/badge.

### 3.5 Registered Courses Section
- **Layout:** Standard grid below the fold.
- **Visual:** Slightly smaller cards than "Continue Learning". Focus on high-level progress rings (SVG circle with `stroke-dashoffset` animation).

### 3.6 Announcement Section
- **Aesthetic:** A full-width horizontal banner or standard glass card. Includes a megaphone icon with a subtle purple glow. 
- **Typography:** Limits text clamping to 2 lines. `text-slate-300 text-sm line-clamp-2`.

---

## 4. Secondary Widgets (Right Sidebar & Below Fold)

### 4.1 Grade Summary Widget
- **Layout:** 2x2 grid of mini-stats inside a single glass panel.
- **Content:** Current CGPA/GPA, Credits Completed, Total Assignments Graded.
- **Animation:** Animated count-up numbers using Framer Motion. Green up-arrows for positive trends.

### 4.2 Attendance Summary Widget
- **Visual:** Semi-circle doughnut chart SVG or an overlapping bar chart displaying "Present vs Empty".
- **Color:** Emerald accents (`text-emerald-400 bg-emerald-500/10`).

### 4.3 Calendar Widget
- **Aesthetic:** Micro-calendar with glass styling.
- **Visuals:** Current day is highlighted with a solid blue circle. Days with assignments have tiny dots underneath the date.
- **Implementation Note:** Avoid heavy external calendar libraries if possible. Build a simple 7x5 CSS Grid of days.

---

## 5. UI States & Feedback

### 5.1 Empty States
- **Design:** Center aligned text and abstract soft SVG icon.
- **Background:** `bg-slate-900/20 border border-dashed border-slate-800 rounded-[24px]`.
- **Example:** "No assignments due soon. Take a breather!"

### 5.2 Loading Skeletons
- **Animation:** `animate-pulse` mixed with soft gradients.
- **Colors:** `bg-slate-800/50` representing text blocks, images, and buttons.
- **Usage:** Replace actual components 1:1 with skeletons to avoid layout shift.

### 5.3 Error States
- **Design:** Gentle warning. Red-tinted glass `bg-red-950/30 border border-red-900`. 
- **Action:** Include a "Retry Connection" ghost button.

---

## 6. Animation Details (Framer Motion)

- **Page Load:** `staggerChildren: 0.05`. Children slide up 20px and fade in.
- **Hover Lift:** `whileHover={{ y: -4, scale: 1.01 }}` on course cards.
- **Live Dot:** Pure CSS: `@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`.
- **Progress Bar:** `initial={{ width: 0 }} animate={{ width: "75%" }} transition={{ duration: 1, ease: 'easeOut' }}`.
- **Dropdown:** `initial={{ opacity: 0, scaleY: 0.9, originY: 0 }}`.

---

## 7. Tailwind CSS Implementation Notes

- **Ambient Background Mesh:**
  Apply to the very bottom `main` container:
  ```css
  background-color: #020617; /* slate-950 */
  background-image: 
    radial-gradient(circle at 15% 50%, rgba(30, 58, 138, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 85% 30%, rgba(88, 28, 135, 0.2) 0%, transparent 50%);
  ```
- **Premium Glass Card Class:**
  ```css
  .card-premium-glass {
    @apply bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] shadow-xl;
  }
  ```
- **Text Gradient:**
  ```css
  .text-premium-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400;
  }
  ```

---

## 8. Suggested Component Tree

```text
app/
 └─ (dashboard)/
     └─ student/
         ├─ page.tsx (Dashboard Container & Grid Manager)
         ├─ components/
         │   ├─ DashboardSidebar.tsx
         │   ├─ DashboardTopbar.tsx
         │   ├─ DashboardMobileNav.tsx
         │   ├─ WelcomeHero.tsx
         │   ├─ sections/
         │   │   ├─ ContinueLearningCarousel.tsx
         │   │   ├─ UrgentLiveClassWidget.tsx
         │   │   ├─ DeadlinesWidget.tsx
         │   │   ├─ RegisteredCoursesGrid.tsx
         │   │   ├─ AcademicOverviewWidget.tsx (Grades & Attendance)
         │   │   └─ MicroCalendarWidget.tsx
         │   └─ ui/
         │       ├─ PremiumGlassCard.tsx
         │       ├─ CourseCard.tsx
         │       ├─ ProgressRing.tsx
         │       └─ PulsingLiveBadge.tsx
```

This specification marries the visual beauty required by modern SaaS aesthetics with the functional density needed for a University-grade Learning Management System.
