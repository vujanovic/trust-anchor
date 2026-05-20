import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  // Form states
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [privateKeyPem, setPrivateKeyPem] = useState("")

  // Runtime architecture states
  const [encryptedChallenge, setEncryptedChallenge] = useState<string | null>(
    null
  )
  const [isFetchingDetails, setIsFetchingDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // 1. Fetch encrypted challenge on mount
  useEffect(() => {
    if (!token) return

    const fetchChallengeDetails = async () => {
      setIsFetchingDetails(true)
      setError(null)
      try {
        // Matches @RequestParam String token mapping
        const response = await fetch(
          `/api/v1/auth/reset-password-details?token=${encodeURIComponent(token)}`,
          {
            method: "POST",
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(
            errorData?.message || "Reset token is invalid or expired."
          )
        }

        const data = await response.json()
        // Expecting object matching your ForgotPasswordResponse payload structure
        setEncryptedChallenge(data.encryptedChallengeBase64)
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load validation parameters."
        )
      } finally {
        setIsFetchingDetails(false)
      }
    }

    fetchChallengeDetails()
  }, [token])

  // Helper: Convert Base64 string to ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  // Helper: Convert PEM string to clean ArrayBuffer for Web Crypto PKCS#8 import
  const pemToArrayBuffer = (pem: string): ArrayBuffer => {
    const cleanPem = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s+/g, "")
    return base64ToArrayBuffer(cleanPem)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token || !encryptedChallenge) {
      setError(
        "Authorization parameters missing. Please use a valid verification link."
      )
      return
    }

    // Aligned with backend validation: @Size(min = 15, max = 64)
    if (password.length < 15 || password.length > 64) {
      setError(
        "Password must evaluate to between 15 and 64 elements in length."
      )
      return
    }

    if (password !== confirmPassword) {
      setError("Confirmation mismatch. Passwords do not align.")
      return
    }

    if (!privateKeyPem.trim()) {
      setError(
        "Local private identity key is required to clear the cryptographic challenge."
      )
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let decryptedChallengeStr = ""

      // 2. Perform client-side decryption using Web Crypto API
      try {
        const privateKeyBuffer = pemToArrayBuffer(privateKeyPem)

        const importedPrivateKey = await window.crypto.subtle.importKey(
          "pkcs8",
          privateKeyBuffer,
          {
            name: "RSA-OAEP",
            hash: "SHA-256", // Matches standard Web Crypto / upgraded Java configuration
          },
          false,
          ["decrypt"]
        )

        const encryptedChallengeBuffer = base64ToArrayBuffer(encryptedChallenge)

        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: "RSA-OAEP" },
          importedPrivateKey,
          encryptedChallengeBuffer
        )

        decryptedChallengeStr = new TextDecoder().decode(decryptedBuffer)
      } catch {
        throw new Error(
          "Decryption failed. Ensure you supplied the correct private key paired to this profile."
        )
      }

      // 3. Dispatch payload to backend verification endpoint
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          decryptedChallenge: decryptedChallengeStr,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text() // Reading text since backend returns raw String on error
        throw new Error(errorData || "Failed to update security credentials.")
      }

      setIsSuccess(true)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected server exception occurred."
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
          {!isSuccess ? (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">
                  Update Password
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Assign new access credentials to your cryptographic profile.
                </p>
              </div>

              {!token && (
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>
                    Warning: No runtime verification token was detected in your
                    browser context. Requests will be denied.
                  </span>
                </div>
              )}

              {error && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isFetchingDetails ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-8 text-slate-400">
                  <Loader2 size={24} className="animate-spin text-cyan-500" />
                  <p className="text-xs">
                    Fetching cryptographic challenge from anchor...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Password Input */}
                  <div>
                    <label
                      htmlFor="pass"
                      className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400"
                    >
                      New Password (Min 15 chars)
                    </label>
                    <div className="relative">
                      <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="pass"
                        type="password"
                        required
                        disabled={!encryptedChallenge}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••••••••••"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label
                      htmlFor="confirmPass"
                      className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="confirmPass"
                        type="password"
                        required
                        disabled={!encryptedChallenge}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="•••••••••••••••"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Private Key Input */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label
                        htmlFor="privateKey"
                        className="block text-xs font-semibold text-slate-500 dark:text-slate-400"
                      >
                        Your Matching Private Key (PEM)
                      </label>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
                        <ShieldCheck size={12} /> Decrypted Locally
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                      <textarea
                        id="privateKey"
                        required
                        disabled={!encryptedChallenge}
                        value={privateKeyPem}
                        onChange={(e) => setPrivateKeyPem(e.target.value)}
                        placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0..."
                        rows={4}
                        className="w-full resize-none rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-10 font-mono text-xs shadow-sm transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !token || !encryptedChallenge}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Verify Zero-Knowledge Challenge & Save"
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold dark:text-white">
                  Credentials Updated
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your identity signature has been confirmed. The new password
                  configuration is active.
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 transition-colors hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                Proceed to Login Terminal
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
