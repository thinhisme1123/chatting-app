"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Loader2, CheckCircle2, Send, Shield, Clock } from "lucide-react"
import { useLanguage } from "@/src/presentation/contexts/LanguageContext"

interface ForgetPassFormProps {
  onBackToLogin: () => void
}

export const ForgetPassForm: React.FC<ForgetPassFormProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"email" | "sent" | "reset">("email")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { t } = useLanguage()

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Call your Node.js API to send reset email
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email")
      }

      setSuccess(true)
      setStep("sent")
    } catch (error: any) {
      setError(error.message || "Failed to send reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Call your Node.js API to verify reset code
      const response = await fetch("/auth/verify-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: resetCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Invalid or expired code")
      }

      setStep("reset")
    } catch (error: any) {
      setError(error.message || "Invalid or expired code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      // Call your Node.js API to reset password
      const response = await fetch("/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: resetCode,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password")
      }

      setSuccess(true)
      // Redirect to login after successful reset
      setTimeout(() => {
        onBackToLogin()
      }, 2000)
    } catch (error: any) {
      setError(error.message || "Failed to reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderEmailStep = () => (
    <form onSubmit={handleSendResetEmail} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("auth.email")}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            id="email"
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Reset Email
          </>
        )}
      </Button>
    </form>
  )

  const renderSentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email Sent!</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          We've sent a reset code to <span className="font-medium text-gray-900 dark:text-white">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="resetCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Reset Code
          </Label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              id="resetCode"
              type="text"
              placeholder="Enter 6-digit code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              className="pl-10 h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 text-center text-lg tracking-widest"
              maxLength={6}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          disabled={loading || resetCode.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Verify Code
            </>
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" />
          Code expires in 15 minutes
        </p>
      </div>
    </div>
  )

  const renderResetStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          New Password
        </Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Reset Password
          </>
        )}
      </Button>
    </form>
  )

  return (
    <Card className="w-full backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 shadow-2xl border-0 dark:shadow-gray-900/50">
      <CardHeader className="space-y-1 pb-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {step === "email" && "Reset Password"}
            {step === "sent" && "Check Your Email"}
            {step === "reset" && "Create New Password"}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "sent" && "Enter the code we sent to your email"}
            {step === "reset" && "Choose a strong new password"}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && step === "reset" && (
          <Alert className="dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Password reset successfully! Redirecting to login...</AlertDescription>
          </Alert>
        )}

        {step === "email" && renderEmailStep()}
        {step === "sent" && renderSentStep()}
        {step === "reset" && renderResetStep()}

        <div className="text-center pt-4">
          <Button
            variant="ghost"
            onClick={onBackToLogin}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
