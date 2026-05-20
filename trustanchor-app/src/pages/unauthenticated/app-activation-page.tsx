import React, { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ShieldCheck,
  Key,
  Terminal,
  Loader2,
  CheckCircle2,
  XCircle,
  FileKey,
} from "lucide-react"
import { api } from "@/lib/axios.ts"
import { importPrivateKey, decryptMessage } from "@/lib/crypto.ts"

type ActivationState =
  | "FETCHING_CHALLENGE"
  | "READY"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"

export default function ActivateAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")

  const [state, setState] = useState<ActivationState>("FETCHING_CHALLENGE")
  const [encryptedChallenge, setEncryptedChallenge] = useState<string>("")
  const [privateKeyPem, setPrivateKeyPem] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        if (!token) {
          setState("FAILED")
          setErrorMessage(
            "Activation token is missing from the initialization URL."
          )
          return
        }
        const response = await api.get<{ encryptedChallengeBase64: string }>(
          `/api/v1/auth/activation-details?token=${token}`
        )
        setEncryptedChallenge(response.data.encryptedChallengeBase64)
        setState("READY")
      } catch (error) {
        console.error("Challenge payload fetch failure:", error)
        setState("FAILED")
        setErrorMessage(
            "The activation link is invalid, expired, or already used."
        )
      }
    }

    fetchChallenge()
  }, [token])

  const handleCryptographicActivation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!privateKeyPem.trim()) return

    setState("PROCESSING")
    setErrorMessage("")

    try {
      const cleanPem = privateKeyPem
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\s/g, "")
      const cleanChallenge = encryptedChallenge.replace(/\s/g, "")
      const privateKey = await importPrivateKey(cleanPem)
      const decryptedText = await decryptMessage(cleanChallenge, privateKey)
      await api.post("/api/v1/auth/activate", {
        token: token,
        decryptedChallenge: decryptedText,
      })

      setState("SUCCESS")
    } catch (error) {
      console.error("Cryptographic processing execution error:", error)
      setState("READY")
      setErrorMessage(
          "Decryption failed. Please verify that this private key matches the public key submitted during registration."
      )
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]"></div>

        <div className="relative z-10 w-full max-w-120">
          {state === "FETCHING_CHALLENGE" && (
            <div className="space-y-4 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Retrieving single-use cryptographic authorization challenge...
              </p>
            </div>
          )}

          {state === "FAILED" && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/20">
              <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h2 className="text-xl font-bold text-red-900 dark:text-red-400">
                Activation Blocked
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {errorMessage}
              </p>
              <button
                onClick={() => navigate("/register")}
                className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
              >
                Back to Enrollment
              </button>
            </div>
          )}

          {state === "SUCCESS" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
              <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-400">
                Identity Verified
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Your cryptographic token response was checked and successfully
                matched. Your account is now fully active.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-6 w-full rounded-md bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
              >
                Proceed to Secure Login
              </button>
            </div>
          )}

          {(state === "READY" || state === "PROCESSING") && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">
                  <ShieldCheck className="h-3 w-3" /> Zero-Knowledge Challenge
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">
                  Verify Identity
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Provide your local Private Key to resolve the security
                  handshake.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
                <form
                  onSubmit={handleCryptographicActivation}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                      <Key
                        size={12}
                        className="text-cyan-600 dark:text-cyan-400"
                      />
                      Associated PEM Private Key
                    </div>

                    <div className="relative">
                      <textarea
                        value={privateKeyPem}
                        onChange={(e) => setPrivateKeyPem(e.target.value)}
                        placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ..."
                        rows={8}
                        disabled={state === "PROCESSING"}
                        className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-700 transition-all placeholder:text-slate-300 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:placeholder:text-slate-800"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="rounded border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-500 dark:border-red-900/30 dark:bg-red-950/30">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={state === "PROCESSING" || !privateKeyPem.trim()}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-3 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {state === "PROCESSING" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Decrypting & Activating...
                      </>
                    ) : (
                      <>
                        <FileKey className="h-4 w-4" />
                        Solve & Activate Account
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-900 dark:bg-slate-950/40">
                <div className="mb-1 flex gap-2 text-slate-400 dark:text-slate-600">
                  <Terminal size={14} />
                  <span className="text-[10px] font-bold tracking-wider uppercase">
                    Privacy Assurance Node
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Decryption occurs entirely within your sandboxed browser
                  context runtime environment. Your master private seed payload
                  key parameters are never exposed or transmitted externally
                  over public pipelines.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
