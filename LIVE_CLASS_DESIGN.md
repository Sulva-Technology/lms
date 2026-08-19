# Sulva LMS: Live Online Class Room Design Specification

**Version:** 1.0.0
**Role:** Premium UI Art Director & Frontend Architect
**Aesthetic:** Dark Immersive, Google Meet Clarity, Premium Glassmorphism Overlays

This document specifies the integrated live class environment for Sulva LMS. It is a highly focused, distraction-free environment that uses structural glassmorphism to present controls only when necessary, maintaining focus on the educational content.

---

## 1. Layout Modes & Screen Architecture

### 1.1 Focus Mode Layout (Default)
*   **Main Video (Center):** Edge-to-edge dark container (`bg-black`) housing the Lecturer's video or Screen Share. High priority `z-10`.
*   **Thumbnail Strip (Top/Right):** Floating small glass tiles for other active speakers or the user's self-view.
*   **Control Bar (Bottom Center):** Floating pill `fixed bottom-8 left-1/2 -translate-x-1/2 z-50`.
*   **Sidebar (Right):** Toggled space for Chat, Participants, and Resources.

### 1.2 Gallery View Layout
*   **Grid:** Responsive dynamic grid (e.g., up to 4x4 or 5x5) depending on participant count.
*   **Tiles:** Glass styling on participant names (`bg-black/50 backdrop-blur-md rounded-md p-1`).
*   **Active Speaker:** The tile of the active speaker gets a glowing border.

### 1.3 Screen Sharing Layout
*   **Presentation Area:** Occupies the majority of the viewport.
*   **Minimised Video:** Lecturer's video is pinned to the top-right corner as a floating, resizable PIP window.

### 1.4 Mobile Layout (< 768px)
*   **Orientation:** Optimised for portrait viewing.
*   **Main Video:** Top half of the screen.
*   **Controls:** Condensed bottom bar.
*   **Sidebar Panels (Chat/Participants):** Open as bottom sheets (`rounded-t-[32px]`) overlaying the bottom half of the screen, draggable to close.

---

## 2. Pre-Class & State Management

### 2.1 Pre-class Waiting Room
*   **Background:** Deep slate (`bg-slate-950`) with a slow-moving, large ambient blur gradient (`bg-blue-900/20 blur-[100px]`).
*   **Center Card:** Floating glass panel `bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 max-w-md mx-auto relative`.
*   **Content:**
    *   Course Title & "Live Lecture".
    *   "Waiting for the host to start..." (subtle pulsing text).
    *   Self-preview video with quick Mic/Cam toggles.
*   **Animation:** The center card floats vertically continuously `animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }}`.

### 2.2 Recording Consent Modal
*   **Trigger:** Displayed when user enters a class that is already recording, or when recording starts.
*   **Aesthetic:** High-elevation glass modal `backdrop-blur-3xl`.
*   **Action:** "Got it" button. Must be explicit to comply with privacy.

### 2.3 End Class Modal / Post-Class
*   **Trigger (Student):** "The lecturer has ended the class."
*   **Trigger (Lecturer):** Confirmation: "End class for all?"
*   **State:** Transition to an attendance summary ("You attended 45/45 minutes") and "Recording Processing..." status.

---

## 3. UI Component Details

### 3.1 Floating Glass Control Bar (The Pill)
*   **Aesthetic:** `bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-full py-3 px-6 shadow-2xl flex gap-3`.
*   **Student Controls:** Mic (Mute/Unmute), Cam, Raise Hand, React (Emoji popup), View Resources, Leave (Red button).
*   **Lecturer Controls:** All student controls PLUS Screen Share, Record (starts pulsing dot), Participants (Admin view), Mute All.

### 3.2 Sidebars (Chat & Participants)
*   **Container:** `w-80 h-[calc(100vh-2rem)] fixed right-4 top-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl z-40 flex flex-col`.
*   **Chat:** Messages slide up from the bottom. Lecturer messages have a distinctive border.
*   **Participants:** List with indicators for Mic, Cam, Hand Raised. Lecturer view includes individual 'Mute' buttons and 'Lower Hand' actions.

### 3.3 Status Indicators
*   **Recording Dot:** Top-left of the viewport. Red dot with `animate-ping` combined with a solid text tag: "REC".
*   **Speaking Participant:** An animated 2px border on their video container. `border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]`.
*   **Raised Hand:** A yellow/gold hand icon overlaid on the participant's video. Bounces subtly `animate={{ y: [0, -5, 0] }}` to grab attention.
*   **Attendance Badge:** A small green checkmark appears briefly next to the user's name when the system logs their presence.

---

## 4. Lecturer-Specific Features

*   **Admit Students:** A toast notification drops down when someone hits the waiting room: "Alex Morgan is waiting" -> [Admit] [Deny].
*   **Start/Stop Recording:** Clear feedback required. If processing, "Recording is saving..." is displayed on the dashboard later.
*   **Take Attendance:** Can be manual or auto-calculated based on join/leave logs.

---

## 5. Animation & Interaction Rules (Framer Motion)

*   **Join Class Button:** Soft glowing pulse `animate={{ boxShadow: ['0px 0px 0px rgba(59,130,246,0)', '0px 0px 20px rgba(59,130,246,0.5)', '0px 0px 0px rgba(59,130,246,0)'] }}`.
*   **Chat Messages Slide-in:** `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}`.
*   **Control Bar Fade:** Like the video player, `initial={{ opacity: 0, y: 20 }}` animating to `1` and `0` based on mouse movement/activity.
*   **Layout Transitions:** Moving from Gallery to Presentation mode uses `layoutId` on the video wrappers to smoothly transition the video size and position rather than cutting sharply.

---

## 6. Suggested Tailwind Component Structure

```text
app/
 └─ (live)/
     └─ class/
         └─ [classId]/
             ├─ page.tsx (Layout Shell)
             ├─ components/
             │   ├─ RoomWorkspace.tsx (Manages layouts: focus vs gallery)
             │   ├─ pre-class/
             │   │   └─ WaitingRoom.tsx 
             │   ├─ video/
             │   │   ├─ MainStage.tsx (Screen share or primary speaker)
             │   │   ├─ ParticipantTile.tsx (Video + Nameplate + Mic status)
             │   │   └─ RecordingIndicator.tsx
             │   ├─ controls/
             │   │   ├─ GlassControlBar.tsx
             │   │   └─ ActionButtons.tsx (Mic, Cam, Hand, Leave)
             │   └─ sidebars/
             │       ├─ ChatPanel.tsx
             │       ├─ ParticipantList.tsx  (Lecturer admin controls inside)
             │       └─ ResourcePanel.tsx
```

This integrated live class design ensures students never feel they've "left the university building" to attend a lecture, maintaining visual continuity and premium branding throughout the entire learning experience.
