"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { resetPasswordAction } from "@/app/actions/auth"
import { Field, FormError, SubmitButton, TextInput } from "./fields"

export function ResetPasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await resetPasswordAction(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      if (result?.success && result.redirectTo) {
        setSuccess(true)
        router.replace(result.redirectTo)
        return
      }
    } catch (err) {
      setError("Could not update password. Please reopen the reset link and try again.")
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <span className="grid size-12 place-items-center rounded-card bg-success/10 text-success">
          <CheckCircle2 size={24} />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Password updated</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Use your new password the next time you sign in.
          </p>
        </div>
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition-[background-color,transform] hover:bg-primary-hover active:scale-[0.99]"
        >
          Continue to sign in
        </Link>
      </motion.div>
    )
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShowPassword((visible) => !visible)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-subtle transition-colors hover:text-ink"
    >
      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError>{error}</FormError>

      <Field label="New password" htmlFor="password" hint="At least 8 characters.">
        <div className="relative">
          <TextInput
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            icon={<Lock size={17} />}
            className="pr-11"
          />
          {toggle}
        </div>
      </Field>

      <Field label="Confirm new password" htmlFor="confirmPassword">
        <TextInput
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat the new password"
          icon={<Lock size={17} />}
        />
      </Field>

      <SubmitButton loading={isLoading}>
        {isLoading ? "Saving" : "Set new password"}
      </SubmitButton>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden />
        Back to sign in
      </Link>
    </form>
  )
}
