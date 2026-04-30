import React, { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import { api } from "@/lib/axios.ts"

export default function AppVerification() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("") // New state
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >(token ? "idle" : "error")
  const [error, setError] = useState<string | null>(
    token ? null : "Authorization token is missing or malformed."
  )

  // Derived state for validation
  const passwordsMatch = password === confirmPassword && password.length > 0
  const isPasswordValid = password.length >= 15

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordsMatch) {
      setError("Passwords do not match.")
      return
    }

    setStatus("loading")
    setError(null)

    try {
      await api.post("/api/v1/auth/verifyUser", {
        token: token,
        password: password,
      })
      setStatus("success")
      setTimeout(() => navigate("/login"), 3000)
    } catch (err) {
      const message =
        err +
        "Verification failed. The link may be expired."
      setError(message)
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/10 p-4 text-green-500">
              <CheckCircle2 size={64} />
            </div>
          </div>
          <h1 className="text-3xl font-bold dark:text-white">
            Identity Verified
          </h1>
          <p className="text-slate-500">
            Your PKI vault has been provisioned. Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]"></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
              <ShieldCheck className="h-3 w-3" /> Identity Enrollment
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">
              Authorize Account
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Finalize your credentials to activate your secure identity.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900/50">
            <form className="space-y-5" onSubmit={handleVerify}>
              <div className="space-y-2 opacity-60">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Security Token
                </label>
                <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-[10px] break-all dark:border-slate-800 dark:bg-slate-950">
                  {token || "NO_TOKEN_DETECTED"}
                </div>
              </div>

              {/* Primary Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Set Master Password
                </label>
                <div className="relative">
                  <Key className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={!token || status === "loading"}
                    placeholder="Min. 15 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-10 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Repeat Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Repeat Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={!token || status === "loading"}
                    placeholder="Confirm master password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-md border bg-slate-50 py-2.5 pr-10 pl-10 text-sm transition-colors focus:outline-none ${
                      confirmPassword && !passwordsMatch
                        ? "border-red-500 dark:border-red-500/50"
                        : "border-slate-200 focus:border-blue-500 dark:border-slate-800"
                    } dark:bg-slate-950`}
                  />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
                    <AlertCircle size={12} /> Passwords do not match
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-500">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  status === "loading" ||
                  !token ||
                  !isPasswordValid ||
                  !passwordsMatch
                }
                className="group relative flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-3 font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Complete Authorization
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-[10px] tracking-widest text-slate-400 uppercase">
            <Lock className="mr-1 inline h-3 w-3" /> Secure Enrollment Protocol
            v3.0
          </p>
        </div>
      </main>
    </div>
  )
}
