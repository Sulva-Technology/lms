"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react"
import Link from "next/link"
import { forgotPasswordAction } from "@/app/actions/auth"
import { Field, FormError, SubmitButton, TextInput } from "./fields"

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await forgotPasswordAction(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <span className="grid size-12 place-items-center rounded-card bg-success/10 text-success">
          <CheckCircle2 size={24} />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Check your email</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            If an account exists for <span className="font-medium text-ink">{email}</span>, reset
            instructions are on their way.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80"
        >
          <ArrowLeft size={15} aria-hidden />
          Back to sign in
        </Link>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError>{error}</FormError>

      <Field
        label="Email"
        htmlFor="email"
        hint="We send the link to the address your institution has on file."
      >
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@institution.edu"
          icon={<Mail size={17} />}
        />
      </Field>

      <SubmitButton loading={isLoading}>
        {isLoading ? "Sending" : "Send reset link"}
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
