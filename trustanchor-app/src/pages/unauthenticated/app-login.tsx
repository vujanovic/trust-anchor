import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Anchor,
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  Key,
  Lock,
  Mail,
  Shield,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function AppLogin() {
  const navigate = useNavigate()
  const { login, verify2fa, user, isAuthenticated } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaToken, setMfaToken] = useState("")
  const [totpCode, setTotpCode] = useState("")

  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (user.role === "ADMIN") navigate("/admin", { replace: true })
    else if (user.role === "CA_USER") navigate("/ca", { replace: true })
    else navigate("/user", { replace: true })
  }, [isAuthenticated, user, navigate])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const data = await login(email, password)
      if (data.mfaRequired && data.mfaToken) {
        setMfaRequired(true)
        setMfaToken(data.mfaToken)
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(message ?? "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await verify2fa(mfaToken, totpCode)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(message ?? "Invalid verification code. Please check your authenticator application.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]"></div>
        <div className="relative z-10 w-full max-w-100">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
              <Lock className="h-3 w-3" /> Secure Access
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">
              {mfaRequired ? "Two-Factor Auth" : "Identity Login"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {mfaRequired
                ? "Enter your 6-digit verification code from Google Authenticator."
                : "Enter your credentials to access the PKI vault."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
            {!mfaRequired ? (
              /* --- Step 1: Standard Credentials Form --- */
              <form className="space-y-5" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="admin@trustanchor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-all focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      Master Password
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-[10px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <Key className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-10 text-sm transition-all focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-center text-sm font-medium text-red-500">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-3 font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:shadow-none dark:hover:bg-slate-100"
                >
                  {isLoading ? "Authenticating..." : "Unlock Vault"}
                  {!isLoading && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </button>
              </form>
            ) : (
              /* --- Step 2: Verification Code Form --- */
              <form className="space-y-5" onSubmit={handleMfaSubmit}>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    6-Digit Token Verification
                  </label>
                  <div className="relative">
                    <Shield className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      placeholder="000 000"
                      value={totpCode}
                      onChange={(e) =>
                        setTotpCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-center font-mono text-lg tracking-[0.5em] transition-all focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-center text-sm font-medium text-red-500">
                    {error}
                  </p>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || totpCode.length !== 6}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-200/50 transition-all hover:bg-blue-500 disabled:opacity-50 dark:shadow-none"
                  >
                    {isLoading ? "Verifying Token..." : "Confirm Identity"}
                    {!isLoading && (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMfaRequired(false)
                      setError(null)
                      setTotpCode("")
                    }}
                    className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Back to credentials
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="flex items-center justify-center gap-4 opacity-50 grayscale transition-all hover:grayscale-0">
                <Fingerprint className="h-5 w-5" />
                <Shield className="h-5 w-5" />
                <Lock className="h-5 w-5" />
              </div>
            </div>
          </div>

          {!mfaRequired && (
            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an identity yet?{" "}
              <button
                onClick={() => navigate("/register")}
                className="font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                Enroll Now
              </button>
            </p>
          )}
        </div>
        <div className="pointer-events-none absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 opacity-[0.05] dark:opacity-[0.1]">
          <Anchor
            size={500}
            strokeWidth={1}
            className="-rotate-12 transform text-slate-900 dark:text-blue-400"
          />
        </div>
      </main>
      <footer className="px-6 py-8 text-center">
        <p className="text-[10px] tracking-widest text-slate-400 uppercase dark:text-slate-600">
          End-to-End Encrypted Session
        </p>
      </footer>
    </div>
  )
}
