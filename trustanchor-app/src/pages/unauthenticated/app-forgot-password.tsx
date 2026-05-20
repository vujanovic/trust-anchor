import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.message || "Failed to process request. Please try again."
        )
      }

      setIsSubmitted(true)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected network error occurred."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
        {/* Background Grid */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]"></div>

        <div className="w-full max-w-md space-y-6">
          {!isSubmitted ? (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">
                  Recover Password
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter your verified identity email to dispatch a recovery
                  token.
                </p>
              </div>

              {error && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.com"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Send Recovery Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-4 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold dark:text-white">
                  Check Your Mailbox
                </h2>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  If{" "}
                  <span className="font-semibold break-all text-slate-800 dark:text-slate-200">
                    {email}
                  </span>{" "}
                  matches an active identity core profile, initialization
                  parameters have been dispatched.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft size={12} />
              Return to Login Terminal
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
