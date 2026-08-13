"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Eye, EyeOff, Loader2, Lock, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { resetPasswordAction } from "@/app/actions/auth"

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
      setError('Could not update password. Please reopen the reset link and try again.')
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-white font-outfit">Password Reset Successfully</h3>
        <p className="text-slate-400 text-sm">
          Your password has been changed. You can now use your new password to log in.
        </p>
        <div className="pt-4">
          <Link href="/login" className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2">
            Continue to Login
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center justify-center font-medium"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-300 ml-1">New Password</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block pl-10 pr-10 p-3.5 transition-all outline-none"
            placeholder="••••••••"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-300 ml-1">Confirm New Password</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block pl-10 pr-10 p-3.5 transition-all outline-none"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 mt-4"
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Set new password"}
      </button>
      
       <div className="pt-2 text-center">
        <Link href="/login" className="text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    </form>
  )
}
