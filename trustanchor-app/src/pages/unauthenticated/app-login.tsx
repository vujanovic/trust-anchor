import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Anchor,
  ArrowRight,
  Fingerprint,
  Key,
  Lock,
  Mail,
  Shield,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function AppLogin() {
  const navigate = useNavigate()
  const { login, user, isAuthenticated } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (user.role === "ADMIN") navigate("/admin", { replace: true })
    else navigate("/user", { replace: true })
  }, [isAuthenticated, user, navigate])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(message ?? "Login failed. Please try again.")
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
              Identity Login
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Enter your credentials to access the PKI vault.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
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
                    href="#"
                    className="text-[10px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Forgot Key?
                  </a>
                </div>
                <div className="relative">
                  <Key className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-all focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
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
            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="flex items-center justify-center gap-4 opacity-50 grayscale transition-all hover:grayscale-0">
                <Fingerprint className="h-5 w-5" />
                <Shield className="h-5 w-5" />
                <Lock className="h-5 w-5" />
              </div>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an identity yet?{" "}
            <button
              onClick={() => navigate("/register")}
              className="font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              Enroll Now
            </button>
          </p>
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
