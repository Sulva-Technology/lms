# VUI LMS: Authentication & Onboarding Design Specification

**Version:** 1.0.0
**Role:** Premium UI Art Director & Frontend Architect
**Aesthetic:** Focus & Trust, Premium Glassmorphism, Academic Mesh Gradients
**Scope:** Multi-tenant University Environment (Auth -> Role Onboarding)

This document outlines the authentication and onboarding experience. As the first touchpoint for Students, Lecturers, and Admins across various universities, the UX must balance extreme security with welcoming, frictionless elegance.

---

## 1. Global Visual & Layout Architecture

### 1.1 The "Immersive Frost" Background
*   **Visual:** Deep base (`slate-950`) over which 3-4 massive, highly-blurred gradient orbs float.
*   **Motion:** The orbs move extremely slowly in random paths to create a living, breathing background.
*   **Tailwind/CSS:** `bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen`.

### 1.2 The Floating Auth Card
*   **Aesthetic:** Dead center of the screen, floating.
*   **Glass Specs:** `bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]`.
*   **Inner Highlight:** `shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]`.
*   **Width:** Strictly `max-w-md` for single forms, `max-w-3xl` for onboarding steps with split views.

### 1.3 Mobile Layout (< 768px)
*   **Structure:** The glass card morphs to cover the entire screen from the bottom up (`rounded-t-[40px] rounded-b-none border-t border-white/10`), anchoring to the bottom edge.

---

## 2. Authentication Pages

### 2.1 Login Page
*   **Header:** VUI Logo + "Welcome Back." Subtext: "Sign in to your university portal."
*   **University Switcher:** A prominent dropdown at the top of the card. e.g., "Currently signing in to: Stanford University". Opens a glass dropdown to switch tenants.
*   **Fields:** Email/Student ID, Password.
*   **Inputs:** `bg-slate-900/50 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-white rounded-xl`. Focus states must have a soft outer glow.
*   **Actions:** "Sign In" (Primary Button). "Forgot Password?" (Ghost Link).
*   **SSO:** "Continue with Google" / "Continue with Microsoft" buttons (`bg-white/5 border border-white/10`).

### 2.2 University Selection Page / Dropdown
*   **Usage:** For users belonging to multiple institutions or initial portal entry.
*   **Layout:** A searchable list of glass tiles (`p-4 hover:bg-white/10 flex items-center gap-3`).
*   **Logos:** University crests in a small 40x40 circle wrapper.

### 2.3 Forgot & Reset Password
*   **Forgot:** Simple email input. "Send Recovery Link".
*   **Reset:** Deep-linked page from email. "New Password", "Confirm Password". Includes a segmented password strength meter (Red -> Yellow -> Green).

### 2.4 Invite Acceptance Flow
*   **Trigger:** User clicks a magic link in their email.
*   **Experience:** They skip standard login. The card opens to a "Welcome to VUI LMS, [Name]" screen with a "Set up your account" CTA spanning directly into onboarding.

---

## 3. Role-Based Onboarding Experiences

Different roles require entirely different context gathering. This happens *after* password creation/verification but *before* dashboard access.

### 3.1 Student First Login Setup
*   **Step 1: Welcome & Verify.** Name, ID Number, Primary Degree. (Read-only if synced with university DB).
*   **Step 2: Profile Picture.** Glass dropzone for photo upload. "Put a face to the name for your professors."
*   **Step 3: Platform Tour (Optional).** 3-slide carousel explaining the Dashboard, Curriculum view, and Live Classes.

### 3.2 Lecturer First Login Setup
*   **Step 1: Department & Title.** e.g., Associate Professor, Computer Science.
*   **Step 2: Bio & Credentials.** Text area for introductory bio visible to students.
*   **Step 3: Technical Check.** A quick, optional prompt to test Mic/Camera to ensure they are ready for Live Classes. "Let's make sure your gear is ready."

### 3.3 Admin First Login Setup
*   **Step 1: Security First.** Mandatory 2-Factor Authentication (2FA) setup. QR code generation on a high-contrast white inner-card for scanning.
*   **Step 2: Role Confirmation.** Summary of permissions (e.g., "You have Super Admin access to Stanford University").

---

## 4. UI States & Feedback

### 4.1 Loading States
*   **Auth Submit:** The "Sign In" button text fades out and is replaced by a smooth, pure CSS spinning circle `border-2 border-white/20 border-t-white`. Button does *not* change width.
*   **Page Transitions:** Skeleton forms using `animate-pulse` mixed with soft slate backgrounds.

### 4.2 Error States
*   **Inline Validation:** Red text `text-red-400 text-xs` slides down smoothly below the input. Input border turns red `border-red-500/50`.
*   **Auth Failure (e.g., Wrong Password):** The entire glass card performs a quick, subtle horizontal shake. A red floating toast appears at the top of the card.

### 4.3 Success States
*   **Account Verified:** A massive emerald-green checkmark draws itself in the center of the card (`pathLength` animation). Soft confetti particles explode behind the glass card.

---

## 5. Animation Details (Framer Motion)

*   **Initial Load Entry:** 
    *   Card: `initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}`.
*   **Background Blobs:** 
    *   `animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}`. Vary values per blob.
*   **Input Focus Glow:** 
    *   `whileFocus={{ boxShadow: "0px 0px 15px rgba(59,130,246,0.3)" }}`.
*   **Error Shake:** 
    *   `animate={{ x: [-10, 10, -10, 10, 0] }} transition={{ duration: 0.4 }}`.
*   **Step Transition (Onboarding):**
    *   Wrap steps in `<AnimatePresence mode="wait">`. `initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}`.

---

## 6. Tailwind Component Structure Suggestion

```text
app/
 └─ (auth)/
     ├─ layout.tsx (Contains the animated mesh background)
     ├─ components/
     │   ├─ AuthGlassCard.tsx
     │   ├─ AnimatedBackground.tsx
     │   ├─ AuthInput.tsx (with built-in error states/focus glow)
     │   ├─ SubmitButton.tsx (handles loading spinner state)
     │   └─ UniversitySwitcher.tsx (Glass Dropdown)
     ├─ login/page.tsx
     ├─ forgot-password/page.tsx
     ├─ reset-password/page.tsx
     └─ onboarding/
         ├─ page.tsx (Controller routing to specific role flows)
         ├─ student/
         ├─ lecturer/
         └─ admin/ (Includes 2FA components)
```

This auth and onboarding flow sets the tone for the entire platform: it tells the user immediately that they are dealing with a secure, highly-polished, and premium software environment.
