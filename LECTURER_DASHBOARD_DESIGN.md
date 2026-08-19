# Sulva LMS: Lecturer Dashboard Design Specification

**Version:** 1.0.0
**Role:** Premium UI Art Director & Frontend Architect
**Aesthetic:** Premium Glassmorphism, Material You Softness, Modern SaaS
**Accent Colors:** Violet (`violet-500`) / Indigo (`indigo-500`)

This document serves as the master blueprint for the Sulva LMS Lecturer Dashboard. It focuses on empowering educators with clear workflows for managing courses, live sessions, assignments, and analytics, reducing administrative friction through intelligent, glassmorphism-inspired UI.

---

## 1. Layout Architecture

### 1.1 Desktop Layout (≥ 1280px)
*   **Structure:** 4-Column Macro Grid (`grid-cols-4` or `grid-cols-12`).
*   **Sidebar (Left):** 250px fixed width, heavy frosted glass.
*   **Main Operations (Center):** Fluid width (`col-span-8`). Houses Hero, Quick Actions, Assigned Courses, Pending Grading, Student Q&A.
*   **Contextual Hub (Right):** 350px fixed width (`col-span-4`). Houses Upcoming Classes (Start button), Analytics Snippet, Recent Recordings for Review.

### 1.2 Tablet Layout (768px - 1279px)
*   **Structure:** 2-Column Grid.
*   **Sidebar:** Collapses to an icon-only dock (80px width).
*   **Content:** The Contextual Hub drops below the Main Operations or stacks alongside depending on space availability.

### 1.3 Mobile Layout (< 768px)
*   **Structure:** Single-column vertical stack.
*   **Navigation:** Bottom navigation bar replacing the sidebar.
*   **Order of Operations:** Hero -> Upcoming Classes (Start Class CTA) -> Quick Actions (horizontal scroll) -> Pending Grading (Urgent) -> Courses.

---

## 2. Core Dashboard Sections

### 2.1 Hero Welcome & Summary
*   **Visual:** Encouraging, clear status overview.
*   **Text:** "Good morning, Dr. Chen." (`font-outfit text-4xl text-white font-semibold`). Last name gets a subtle violet-to-indigo gradient.
*   **Metrics Row:** Stats such as "4 Active Courses", "12 Pending Assignments", "84% Avg Attendance". Numbers count up to target using Framer Motion.

### 2.2 Quick Actions Section (The Command Center)
*   **Layout:** A row of 3-4 glass pill-buttons.
*   **Buttons:**
    1.  [+] Schedule Live Class
    2.  [+] Upload Video
    3.  [+] Create Assignment
    4.  [+] New Announcement
*   **Aesthetic:** `bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] rounded-full px-5 py-2.5 transition-all`.

### 2.3 Assigned Courses Section
*   **Layout:** CSS Grid of course cards.
*   **Course Card:** Glass panel (`bg-white/5 border-white/10`).
    *   Thumbnail with course title overlaid.
    *   Key stats: "45 Students", "Module 4 Active".
    *   Button: "Manage Course" (`ghost-button`).
    *   Hover: Lifts slightly `-translate-y-1`.

### 2.4 Upcoming Classes Section (Contextual Hub)
*   **Theme:** Readiness and Action.
*   **Widget:** `border-l-4 border-l-violet-500 bg-slate-800/40 p-4 rounded-xl`.
*   **Content:** "Software Engineering - CSC301", Time (`10:00 AM`).
*   **CTA:** "Start Class" button. Primary Violet solid button. If the class is within 15 mins, a countdown timer ticks down next to it.

### 2.5 Pending Grading Section (Action Required)
*   **Visual:** List layout inside a glass card.
*   **Items:** "Neural Net Architecture Essay", "32 submissions", "Due 2 days ago".
*   **Status Badge:** If urgent (e.g., > 3 days ungraded), a small orange dot `animate-ping` appears next to it.

### 2.6 Recording Review Section
*   **Purpose:** Post-class workflow. Lecturers must review or simply publish auto-recorded sessions.
*   **Visual:** Small cards sliding into view when a processing finishes. "CSC301 Lecture 12 Recording Ready".
*   **Actions:** [Publish] [Review/Edit] [Delete].

### 2.7 Student Q&A Section
*   **Layout:** Thread previews.
*   **Visual:** Avatar of student, truncated question, course tag. Simple "Reply" ghost button.

### 2.8 Course Engagement Analytics Snippet
*   **Visual:** Mini line chart (using Recharts or similar). Path length animates on mount `pathLength: 0 -> 1`.
*   **Stats:** Weekly active students, average video watch time.

---

## 3. Modals & Forms

### 3.1 Announcement Composer
*   **Trigger:** From Quick Actions.
*   **Aesthetic:** Glass modal (`bg-slate-900/80 backdrop-blur-2xl`).
*   **Content:** Title input, rich text area, Course selector dropdown.
*   **Actions:** [Send Now], [Schedule for Later].

---

## 4. UI States

### 4.1 Empty States
*   **Pending Grading:** "All caught up! No pending submissions." with a subtle checkmark illustration.
*   **Questions:** "No unanswered questions. Your students are tracking perfectly."

### 4.2 Loading Skeletons
*   **Visual:** `animate-pulse` on `bg-slate-800/50`. Match the radii of the anticipated content (e.g., pill shapes for quick actions, rectangles for cards).

---

## 5. Animation Details (Framer Motion)

*   **Dashboard Entrance:** Parent variant with `staggerChildren: 0.05`. Elements slide up `y: 20 -> 0` and fade in.
*   **Stats Count Up:** Use `framer-motion` `animate()` on a `MotionValue` rounding to integers.
*   **Hover Lift:** Course cards `whileHover={{ y: -5, scale: 1.01 }}`.
*   **Quick Action Glow:** Soft shadow transition `boxShadow: ["0px 0px 0px rgba(139,92,246,0)", "0px 0px 20px rgba(139,92,246,0.3)"]`.
*   **Recording Reveal:** When a recording becomes available, it slides in from the right: `initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}`.

---

## 6. Suggested Tailwind Component Tree

```text
app/
 └─ (dashboard)/
     └─ lecturer/
         ├─ page.tsx (Dashboard Shell)
         ├─ components/
         │   ├─ LecturerSidebar.tsx
         │   ├─ LecturerTopbar.tsx
         │   ├─ WelcomeHero.tsx
         │   ├─ QuickActionsBar.tsx
         │   ├─ sections/
         │   │   ├─ AssignedCoursesGrid.tsx
         │   │   ├─ PendingGradingList.tsx
         │   │   ├─ UnansweredQuestions.tsx
         │   │   ├─ UpcomingClassesWidget.tsx
         │   │   ├─ RecordingReviewWidget.tsx
         │   │   └─ MiniAnalyticsChart.tsx
         │   └─ modals/
         │       └─ AnnouncementComposerModal.tsx
```

By prioritizing actionable workflows within a premium, non-cluttered glassmorphism environment, the lecturer dashboard minimizes cognitive load and allows educators to focus on teaching.
