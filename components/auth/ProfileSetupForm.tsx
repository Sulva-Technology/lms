"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Building, CheckCircle2, Eye, EyeOff, GraduationCap, Lock, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { completeOnboardingAction } from "@/app/actions/onboarding"
import { AuthRole } from "@/types/auth"
import { roleLabels } from "@/lib/auth/roles"
import { Field, FormError, SubmitButton, TextInput } from "./fields"

interface ProfileSetupFormProps {
  assignedRole: AuthRole | null
  universityName?: string | null
  email?: string | null
  initialFirstName?: string | null
  initialLastName?: string | null
  inviteError?: string | null
}

export function ProfileSetupForm({
  assignedRole,
  universityName,
  email,
  initialFirstName,
  initialLastName,
  inviteError,
}: ProfileSetupFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState(inviteError || "")
  const [showPassword, setShowPassword] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!assignedRole) {
      setError("This invite is missing secure role metadata. Ask an administrator to resend it.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const result = await completeOnboardingAction(new FormData(e.currentTarget))
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      if (result?.success && result.redirectTo) {
        router.replace(result.redirectTo)
        router.refresh()
        return
      }

      setError("We could not confirm onboarding completion. Please try again.")
      setIsLoading(false)
    } catch (err) {
      setError("We could not complete onboarding. Please try again.")
      setIsLoading(false)
    }
  }

  const facts = [
    {
      icon: ShieldCheck,
      label: "Assigned role",
      value: assignedRole ? roleLabels[assignedRole] : "Missing invite data",
    },
    {
      icon: Building,
      label: "Institution",
      value:
        universityName ||
        (assignedRole === "super_admin" ? "VUI Platform" : "Pending assignment"),
    },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <p className="eyebrow">Almost there</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Complete your profile
        </h1>
        <p className="mt-3 text-base text-ink-muted">
          Your role and institution came from your invitation and cannot be changed here.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {facts.map(({ icon: Icon, label, value }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="panel flex items-center gap-4 rounded-card p-5"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary-soft-contrast">
              <Icon size={19} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow">{label}</p>
              <p className="mt-1 truncate font-medium text-ink">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="panel mt-4 rounded-panel p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormError>{error}</FormError>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName">
              <TextInput
                id="firstName"
                name="firstName"
                type="text"
                required
                defaultValue={initialFirstName || ""}
                placeholder="Jane"
              />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <TextInput
                id="lastName"
                name="lastName"
                type="text"
                required
                defaultValue={initialLastName || ""}
                placeholder="Doe"
              />
            </Field>
          </div>

          {email ? (
            <p className="rounded-card border border-line bg-canvas-sunken px-4 py-3 text-sm text-ink-muted">
              Invite email: <span className="font-medium text-ink">{email}</span>
            </p>
          ) : null}

          {assignedRole === "student" ? (
            <Field label="Student ID" htmlFor="studentId" hint="Optional — you can add it later.">
              <TextInput
                id="studentId"
                name="studentId"
                type="text"
                placeholder="e.g. VUI/2026/0042"
                icon={<GraduationCap size={17} />}
              />
            </Field>
          ) : null}

          <Field
            label="Avatar URL"
            htmlFor="avatarUrl"
            hint="Optional — a link to a photo you already host."
          >
            <TextInput id="avatarUrl" name="avatarUrl" type="url" placeholder="https://..." />
          </Field>

          <Field
            label="Create a password"
            htmlFor="password"
            hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
          >
            <div className="relative">
              <TextInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your new password"
                icon={<Lock size={17} />}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-subtle transition-colors hover:text-ink"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm password" htmlFor="confirmPassword">
            <TextInput
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat the password"
              icon={<Lock size={17} />}
            />
          </Field>

          <SubmitButton loading={isLoading} disabled={Boolean(inviteError)}>
            {isLoading ? null : <CheckCircle2 size={17} aria-hidden />}
            {isLoading ? "Finishing" : "Complete setup"}
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
