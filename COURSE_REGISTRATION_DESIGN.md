# VUI LMS: Course Registration Design Specification

**Version:** 1.0.0
**Role:** Premium UI Art Director & Frontend Architect
**Aesthetic:** Clean Academic Workflow, Google-inspired Clarity, Glassmorphism Stepper

This document details the course registration experience. Historically, university portals make this process confusing and anxiety-inducing. VUI LMS transforms it into a guided, consumer-grade checkout experience: intuitive, visually reassuring, and structurally robust.

---

## 1. Registration Dashboard & Status

### 1.1 Active Registration Banner
*   **Visual:** Floats at the top of the student dashboard when registration is open.
*   **Aesthetic:** `bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-4 backdrop-blur-md`.
*   **Content:** "Fall 2026 Registration is Open" + Countdown timer ("Closes in 5 days").
*   **CTA:** "Start Registration" primary button.

### 1.2 Registration Status Card
*   **Context:** For students who have started or completed the process.
*   **Aesthetic:** Glass card `bg-white/5 border-white/10`.
*   **Data Points:** Session (2026/2027), Semester (Fall), Level (300 Level), Department (Computer Science).
*   **Status Badges:**
    *   *Not Started:* Slate badge.
    *   *Draft:* Blue badge.
    *   *Pending Approval:* Orange badge `animate-pulse`.
    *   *Approved:* Emerald badge with checkmark.
    *   *Rejected:* Red badge with alert icon.

---

## 2. The Registration Flow (Stepper Architecture)

### 2.1 Layout
*   **Structure:** 2-Column Desktop layout.
*   **Left Column (70%):** The Stepper and active step content.
*   **Right Column (30%):** Sticky "Registration Summary" and Credit Unit Tracker.

### 2.2 Glassmorphism Stepper
*   **Visual:** Horizontal top bar. `bg-slate-900/60 backdrop-blur-2xl sticky top-0 z-40 py-4`.
*   **Nodes:** 
    1. Confirm Profile
    2. Compulsory Courses
    3. Electives
    4. Review & Submit
*   **Animation:** A connecting line with an animated `width` indicating progress. Active nodes scale up `scale-110` with a blue glow.

---

## 3. Course Selection Interfaces

### 3.1 Compulsory Courses Section
*   **UX Rule:** Compulsory courses are pre-added. The student reviews them but cannot easily remove them (unless given special override limits).
*   **Card Design:** `bg-slate-800/40 border-l-[3px] border-l-blue-500 rounded-xl p-4`.
*   **Content:** Course Code (CSC 301), Title, Credit Units (3 Units).
*   **Indicator:** A distinct locked/shield icon indicating "Required for your program".

### 3.2 Elective Courses Section
*   **Layout:** Vertical list of available courses.
*   **Course Card:** `hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl p-4 flex justify-between items-center transition-all`.
*   **Interaction (Add/Drop):**
    *   Plus button: `bg-white/10 hover:bg-blue-500 hover:text-white rounded-full p-2`.
    *   When clicked, the card briefly flashes an success overlay, the button turns into a red `Minus` icon, and the card's border turns emerald.

### 3.3 Warnings & Validations
*   **Prerequisite Warning:** If a student hasn't passed CSC 201, the CSC 301 card is dimmed (`opacity-50`). A yellow tooltip/lock icon states: "Prerequisite not met: Requires CSC 201". The "Add" button is disabled.
*   **Course Conflict:** If adding a course conflicts with an already selected course's timetable, a slide-down banner inside the card appears (`bg-orange-500/10 text-orange-400 text-xs px-3 py-1 rounded`).
*   **Credit Unit Limit:** Prevent adding courses if the max limit (e.g., 24 Units) is reached. Show a toast notification and shake the credit unit widget.

---

## 4. The Summary Widget (Right Sidebar)

### 4.1 Sticky Glass Panel
*   **Aesthetic:** `bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 sticky top-24`.
*   **Credit Unit Bar:** 
    *   Visual representation of loaded credits.
    *   Track: `bg-slate-800 h-3 rounded-full w-full`.
    *   Fill: `bg-gradient-to-r from-blue-500 to-emerald-500 hs-full rounded-full`.
    *   Text: "18 / 24 Maximum Units".
*   **Selected Courses Line Items:** A compact text list animating in as courses are added.

---

## 5. Review & Approval States

### 5.1 Review Selected Courses Step
*   **Format:** A clean, solid-surface table summarising all selections.
*   **Action:** Checkbox "I confirm these selections meet my program requirements."
*   **Submit:** Large primary button, generating a premium confirmation sequence (e.g., a massive checkmark draw, confetti, or a satisfying spring scale-up card).

### 5.2 Approval Pending State
*   **Design:** The dashboard locks the registration flow and shows a read-only view.
*   **Header:** "Registration Submitted. Awaiting Course Advisor Approval."
*   **Animation:** A slow, breathing soft orange glow around the main status card.

### 5.3 Rejected State
*   **Design:** Visually urgent. Red tinted borders.
*   **Feedback:** Prominent glass panel at the top showing the advisor's note: "You cannot take 24 credits this semester due to academic probation status. Please drop one elective."
*   **Action (Edit & Resubmit):** Unlocks the flow retaining previous selections so the student can simply drop the problematic course and resend.

---

## 6. Edge Cases & Layout Details

### 6.1 Mobile Layout (< 768px)
*   **Changes:** The right sidebar disappears. It is replaced by a sticky heavy-glass bottom bar (`fixed bottom-0 w-full`) showing the Credit Bar and a "View Summary" button that pulls up a Bottom Sheet.

### 6.2 Empty States
*   **No Electives Available:** "You have no available electives for this semester. Proceed to review."

### 6.3 Loading States
*   **Course Fetching:** Skeleton rows `h-16 animate-pulse bg-slate-800/50 rounded-xl mb-3`.

---

## 7. Animation Rules (Framer Motion)

*   **Stepper Transition:** `layoutId` on the connecting blue line.
*   **Add Course Micro-interaction:** 
    *   When an elective is added, use `<AnimatePresence>` to slide a duplicate of its title over to the summary sidebar (Shared Element transition) or simply slide it into the summary box (`initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}`).
*   **Credit Bar Fill:** `animate={{ width: \`${(currentUnits/maxUnits)*100}%\` }} transition={{ duration: 0.5, ease: "easeOut" }}`.
*   **Validation Tremble:** If trying to add beyond max credits, apply a quick `x: [-5, 5, -5, 5, 0]` shake animation to the credit bar.

---

## 8. Suggested Tailwind Component Structure

```text
app/
 └─ (dashboard)/
     └─ student/
         └─ registration/
             ├─ page.tsx (Flow Controller)
             ├─ components/
             │   ├─ RegistrationStepper.tsx
             │   ├─ steps/
             │   │   ├─ ProfileConfirmStep.tsx
             │   │   ├─ CompulsoryCourseStep.tsx
             │   │   ├─ ElectiveCourseStep.tsx
             │   │   └─ ReviewSubmitStep.tsx
             │   ├─ sidebar/
             │   │   ├─ CreditUnitTracker.tsx
             │   │   └─ SummaryCart.tsx
             │   ├─ ui/
             │   │   ├─ CourseOptionCard.tsx
             │   │   ├─ PrerequisiteWarning.tsx
             │   │   └─ ConflictBanner.tsx
             │   └─ states/
             │       ├─ PendingApprovalView.tsx
             │       └─ RejectedCorrectionView.tsx
```

This design turns a typically bureaucratic, error-prone task into a clear, empowering, and fluid UX that helps students plan their academic trajectory with confidence.
