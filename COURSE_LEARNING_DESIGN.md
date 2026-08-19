# Sulva LMS: Course Learning Page Design Specification

**Version:** 1.0.0
**Target Course:** CSC 301 - Software Engineering
**Role:** Premium UI Art Director & Frontend Architect
**Aesthetic:** Premium Udemy UX + University Rigor + Glassmorphism

This document specifies the layout, components, and animations for the main course learning page within Sulva LMS. It is designed to be immersive, focusing heavily on reducing friction for the student while providing comprehensive tools for the university environment.

---

## 1. Layout Architecture

### 1.1 Desktop Layout (≥ 1280px)
*   **Top Bar & Sidebar:** Standard LMS navigation shell.
*   **Course Hero Header (Full Width of Content Area):** Spans the entire top of the view. Bleeds into standard background.
*   **Main Content Grid (Below Hero):** `grid-cols-12 gap-8`
    *   **Primary Column (Left, `col-span-8`):** Tab navigation, Selected tab content (Curriculum, Assignments, Discussions).
    *   **Secondary Column (Right, `col-span-4`):** Sticky sidebar containing Lecturer Profile, Course Metadata (Credits/Semester), Upcoming Live Classes, Course Calendar widget, and Quick Grades snippet.

### 1.2 Mobile Layout (< 768px)
*   **Structure:** Single column vertical stack.
*   **Order:** 
    1. Hero Header (condensed) 
    2. Primary CTAs (Continue Learning / Join Live Class) 
    3. Sticky Tab Navigation (scrollable horizontally `overflow-x-auto`)
    4. Tab Content
    5. Sidebar widgets (Lecturer, Metadata) pushed below content tabs.

---

## 2. Component Designs

### 2.1 Course Hero Header
*   **Background:** Deep elegant gradient `bg-gradient-to-br from-blue-900/40 via-indigo-900/20 to-slate-950` layered with a subtle radial mesh.
*   **Glass Overlay:** A large glass panel resting on the background `bg-slate-950/40 backdrop-blur-3xl border-b border-white/10`.
*   **Content (Left):**
    *   Badge: "Fall 2026 • CSC 301" (`bg-blue-500/20 text-blue-300 rounded-full px-3 py-1 text-xs`).
    *   Title: "Software Engineering" (`text-4xl lg:text-5xl font-outfit font-semibold`).
    *   Tags: [3 Credit Units] [Core Requirement]
*   **Content (Right - Student View):**
    *   Large Progress Ring: 64% Completed.
    *   Primary Action: "Resume: Module 3 - Agile Methodologies" (`bg-blue-600 hover:bg-blue-500 rounded-full flex items-center`).
*   **Content (Right - Lecturer View):**
    *   Primary Action: "Edit Course Content" (`glass-button`).
    *   Secondary Metric: "45 Enrolled Students".

### 2.2 Tab Structure System
*   **Aesthetic:** Clean, flush-left tabs sitting just below the hero section.
*   **Items:** Curriculum | Assignments & Quizzes | Discussions | Resources | Announcements.
*   **Active State:** Text changes from `text-slate-400` to `text-white`.
*   **Animation:** Use Framer Motion `layoutId="course-tab-indicator"` for a smooth sliding bottom border (`h-0.5 bg-blue-500 rounded-t-lg`).

### 2.3 Curriculum Module Design (Expandable Accordion)
*   **Container:** `bg-white/5 border border-white/10 rounded-[24px] mb-4 overflow-hidden`.
*   **Header (Clickable):**
    *   Left: Module title + "4 / 6 Lessons Completed".
    *   Right: Chevron icon + Circular progress ring.
    *   Hover: `bg-white/[0.08]`.
*   **Body (Expanded):** `bg-slate-900/50` with an inner shadow.

### 2.4 Lesson Card Design (Inside Module)
*   **Container:** Simple, flat horizontal card. `flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer group`.
*   **Thumbnail:** 16:9 ratio, width 120px. Dark overlay with a centered Play icon that reveals on hover.
*   **Details:** Title (`text-sm font-medium`), Type (Video, Document, Live Recording), Duration.
*   **Status Indication:** A hollow circle for unread, a green checkmark (`text-emerald-500`) for completed.

### 2.5 Recorded Class Card Design
*   Similar to lesson cards, but includes a prominent date tag, e.g., "Recorded on Oct 12, 2026".
*   Iconography uses a Video camera icon instead of a generic play button.

### 2.6 Assignment & Quiz Card Design
*   **Container:** Glass card `bg-slate-800/40 border-l-[3px] border-l-blue-500 rounded-xl p-5`.
*   **Header:** Title + Status Badge (Pending, Graded, Overdue).
*   **Details:** Due Date, Total Points.
*   **Score State:** If graded, display a large score `24/30` with a link to "View Feedback".

### 2.7 Discussion/Q&A Preview Design
*   **Layout:** Thread-style list.
*   **Row:** User avatar, Question title, "Asked 2 hrs ago", Response count badge (`bg-white/10 text-slate-300 rounded-full px-2`).

### 2.8 Lecturer & Student Controls
*   **Student Controls:** Prominent "Continue Learning" buttons, "Submit Assignment" upload zones (drag-and-drop glass panels), "Mark as Done" toggles.
*   **Lecturer Controls:** "Add Module" (ghost button at bottom of curriculum), "Grade Pending" badges on the assignments tab, inline edit pencil icons appearing on hover.

---

## 3. Sidebar Widgets (Secondary Column)

### 3.1 Upcoming Live Class Widget
*   **Theme:** Urgency. If happening today, use the `border-red-500/30` pulsing design. 
*   **Call to Action:** "Join Meeting Room" - opens the Live Class UI.

### 3.2 Lecturer Profile
*   **Aesthetic:** Clean glass panel (`bg-white/5 rounded-[24px] p-6`).
*   **Elements:** 80px Circular avatar, Name, Credentials/Role, Bio snippet.
*   **Action:** "Send Message" (`glass-button`).

### 3.3 Course Calendar Snippet
*   Displays a mini-month view highlighting assignment due dates and upcoming live lectures for *this specific course* only.

---

## 4. UI States

### 4.1 Empty States
*   **Curriculum (Lecturer):** Large dropzone: "Drag and drop video files, or click to create your first module."
*   **Discussions (Student):** "No questions yet. Be the first to start a conversation!" with a large `MessageSquare` icon (opacity 20%).

### 4.2 Loading States
*   **Modules:** Skeleton blocks replicating the accordion headers. `animate-pulse bg-slate-800/50 rounded-[24px] h-20 mb-4`.

---

## 5. Animation & Microinteractions (Framer Motion)

*   **Tab Switching:** Crossfade content using `<AnimatePresence mode="wait">`. Content slides in slightly from the direction of the tab click (`initial={{ x: 20, opacity: 0 }}`).
*   **Accordion Expand:** `animate={{ height: isOpen ? 'auto' : 0 }}`. Ensure `overflow: hidden` is set on the motion div.
*   **Completion Checkmark:** Draw-in animation. `initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}`.
*   **Hero Entrance:** The hero background fades in slowly (`duration: 1.2`), while the glass panel slides up 30px (`duration: 0.6, type: 'spring'`).

---

## 6. Suggested Component Tree

```text
app/
 └─ (dashboard)/
     └─ course/
         └─ [courseId]/
             ├─ page.tsx (Layout & Header)
             ├─ components/
             │   ├─ CourseHeroHeader.tsx
             │   ├─ CourseTabs.tsx
             │   ├─ tabs/
             │   │   ├─ CurriculumTab.tsx
             │   │   │   ├─ ModuleAccordion.tsx
             │   │   │   └─ LessonCard.tsx
             │   │   ├─ AssignmentsTab.tsx
             │   │   │   └─ AssignmentCard.tsx
             │   │   └─ DiscussionsTab.tsx
             │   └─ sidebar/
             │       ├─ LecturerProfileWidget.tsx
             │       ├─ CourseStatsWidget.tsx
             │       └─ UpcomingClassWidget.tsx
             └─ lesson/
                 └─ [lessonId]/page.tsx (Video Player View)
```

This design guarantees that students feel they are using a world-class technology product to pursue their academic goals, merging the utility of old-school LSMs with the delight of modern consumer software.
