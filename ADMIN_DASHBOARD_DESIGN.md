# VUI LMS: Admin Dashboard Design Specification

**Version:** 1.0.0
**Role:** Premium UI Art Director & Frontend Architect
**Aesthetic:** Premium SaaS Control Center, Emerald/Teal Accent, Clear & Trustworthy
**Accent Colors:** Emerald (`emerald-500`) / Teal (`teal-400`)

The Admin Dashboard is the central nervous system of the university LMS. It eschews the chaotic, text-heavy designs of legacy portals in favor of a sleek, extremely high-utility Google/Stripe-inspired interface. Glassmorphism is used exclusively for floating elements, analytics, and focal points, while massive data tables use clear, solid backgrounds to ensure perfect legibility.

---

## 1. Layout & Navigation Architecture

### 1.1 Full Dashboard Layout (Desktop ≥ 1280px)
*   **Structure:** 2-Column Application Shell.
*   **Sidebar (Left):** 280px fixed width. Solid slate `bg-slate-950` with a subtle right border `border-white/5`.
*   **Main Operations (Center/Right):** Fluid width. Includes a top sticky header (for global search, breadcrumbs, user profile) and the main content canvas (`bg-slate-950`). The max-width of content can be bound to `max-w-7xl` or stretch fluidly depending on the inner table size.

### 1.2 Navigation Architecture (Sidebar Grouping)
*   Collapsible accordion groups to manage scale:
    *   **Overview:** Dashboard Home, Storage & Usage.
    *   **Academic Structure:** Faculties, Departments, Programs.
    *   **User Management:** Students, Lecturers, Admins.
    *   **Learning & Enrollment:** Courses, Course Registration, Academic Sessions, Semesters.
    *   **Media & Content:** Live Classes, Uploaded Videos.
    *   **Reports:** Attendance, Grades, Analytics.
    *   **System Controls:** Branding, Roles & Permissions, Audit Logs.

### 1.3 Responsive Layout Rules
*   **Tablet (768px - 1279px):** Sidebar collapses to icons only (80px width) with flyout menus on hover.
*   **Mobile (< 768px):** Admin dashboards are desktop-primary. On mobile, employ a top header with a hamburger menu activating a full-screen glass overlay navigation. Tables on mobile must use horizontal scrolling or collapse into card-based lists.

---

## 2. Core UI Concepts

### 2.1 Glassmorphism Rules (Analytics vs. Data)
*   **DO USE GLASS:** For top-level Analytics Overview cards, floating command palettes, advanced filter dropdowns, modals, and sticky bulk-action bars. (`bg-slate-800/60 backdrop-blur-2xl border-emerald-500/20`).
*   **DO NOT USE GLASS:** For large data tables. Reading dense data against a blurred background causes eye strain.
*   **DATA TABLES:** Use solid high-contrast surfaces (`bg-slate-900/90` or pure `bg-[#0f172a]`), `border-slate-800`.

### 2.2 Data Tables (The Standard)
*   **Header:** Sticky top header (`sticky top-0 bg-slate-900/95 backdrop-blur-md z-10`).
*   **Rows:** 1px bottom border `border-slate-800`. Hover state: `hover:bg-white-[0.02]`.
*   **Actions:** Right-aligned sticky column with a "..." (More Vertical) icon opening a contextual glass dropdown.

### 2.3 Search, Filter & Bulk Actions
*   **Global Search:** `Cmd + K` Command Palette opens a large glass modal. Searches across students, courses, menus.
*   **Advanced Filters:** A "Filters" button above tables opens a `bg-slate-800/80` glass dropdown. Support complex queries (e.g., "Enrolled = True" AND "Department = CS").
*   **Bulk Actions:** When checkboxes are selected, a floating glass pill (`bg-teal-900/80 backdrop-blur-xl border border-teal-500/30`) slides up from the bottom center of the screen containing actions: [Delete], [Suspend], [Export CSV], etc.

---

## 3. Module Specific Instructions

### 3.1 Analytics Overview & Storage UI
*   **Top Cards (Glass):** "Total Students", "Active Lecturers", "Storage Used".
*   **Storage/Video Usage UI:** Uses animated concentric SVG progress rings. (e.g., 850GB / 1TB). Turns from Emerald -> Orange -> Red as usage nears quota.

### 3.2 Academic Structure (Faculties, Depts, Programs)
*   **UI:** Hierarchical nested tables or standard flat tables with strict relational filters. 
*   **Modals:** "Add Faculty" opens a smooth spring-animated glass modal overlay.

### 3.3 User Management (Students & Lecturers)
*   **Data Included:** Avatar, ID Number, Name, Email, Department, Status (Badge).
*   **Status Badges:** Pill-shaped (`rounded-full`). Emerald for "Active", Orange for "Suspended", Slate for "Inactive".
*   **Action Menu:** Reset Password, Edit Details, View Transcript, Suspend User.

### 3.4 Enrollment & Setup (Sessions & Registration)
*   **Academic Session Setup:** A dedicated setup wizard card for defining the year (e.g., "2026/2027"), Start/End dates, and linking semesters.
*   **Course Registration:** Admin view to forcefully enroll/drop students, override prerequisites, or configure self-enrollment windows.

### 3.5 Reports (Attendance & Grades)
*   **UI Focus:** Extremely dense, purely functional tables. Minimal padding (`py-2 px-3`) to maximize screen real estate.
*   **Features:** One-click "Export to Excel/PDF" ghost buttons.

### 3.6 System Controls & Audit
*   **Branding Settings UI:** Form allowing logo uploads, primary university color hex code input, and custom portal name. Preview window immediately reflects changes.
*   **Roles & Permissions:** Matrix UX. Columns: Roles (Super Admin, Sub Admin, Registrar). Rows: Entities (Users, Courses). Cells: Checkboxes to enable Create/Read/Update/Delete.
*   **Audit Log UI:** Immutable, system-generated log table. Grey, monospaced fonts for timestamps and IP addresses to denote system mechanics.

---

## 4. UI States

### 4.1 Empty States
*   **Visual:** Dead center of the table container.
*   **Format:** A large abstract outline icon (e.g., `Users` or `FolderX` in `text-slate-700`), a header ("No departments found"), and a primary CTA ("+ Create Department").

### 4.2 Loading Skeletons
*   **Table Loading:** The table header renders normally. The rows render as 5-10 fading skeleton rectangles `animate-pulse bg-slate-800/50 h-8 my-2 rounded-md`.

### 4.3 Error States
*   **Inline Warnings:** Soft red backgrounds `bg-red-950/20 text-red-400 border border-red-900/50 p-4 rounded-xl` above the table.
*   **Toasts:** Slide in from bottom right for transient failures (e.g., "Failed to update user role").

---

## 5. Animation Rules (Framer Motion)
*   **Dashboard Entrance:** Staggered fade in `staggerChildren: 0.1` for the initial analytics cards.
*   **Table Row Reveals:** Do NOT stagger 500 rows, it will lag. Only animate the entrance of the table container itself `opacity: 0 -> 1` over `0.4s`.
*   **Bulk Action Bar:** `initial={{ y: 100, opacity: 0 }}` -> `animate={{ y: 0, opacity: 1 }}` using a snappy spring `type: "spring", stiffness: 400, damping: 25`.
*   **Charts & Rings:** `pathLength: 0 -> 1` drawing animations on mount.

---

## 6. Suggested Tailwind Component Structure

```text
app/
 └─ (dashboard)/
     └─ admin/
         ├─ page.tsx (Overview Shell)
         ├─ components/
         │   ├─ AdminSidebar.tsx
         │   ├─ AdminHeader.tsx (Search, Breadcrumbs)
         │   ├─ CommandPalette.tsx
         │   ├─ ui/
         │   │   ├─ AdminDataTable.tsx (Solid surface, sticky headers)
         │   │   ├─ BulkActionBar.tsx (Floating glass pill)
         │   │   ├─ StatusBadge.tsx
         │   │   ├─ FilterDropdown.tsx
         │   │   └─ DataMetricCard.tsx (Glass analytics)
         │   └─ features/
         │       ├─ users/
         │       ├─ academic-structure/
         │       ├─ reports/
         │       └─ system/
```

This layout empowers a high-level university administrator to effortlessly manage thousands of users and courses, executing precise tasks without battling a cluttered or confusing interface.
