// src/pages/AppRegistration.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { type SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Anchor,
  ArrowRight,
  Building2,
  Download,
  Eye,
  EyeOff,
  Fingerprint,
  Key,
  Lock,
  type LucideIcon,
  Mail,
  Shield,
} from "lucide-react"
import { api } from "@/lib/axios.ts"
import {
  type RegistrationFormValues,
  registrationSchema,
} from "@/lib/validations.ts"
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  downloadPrivateKey,
} from "@/lib/crypto"

interface Organization {
  id: number
  name: string
  code: string
  email: string
  registrationDate: string
  domain: string
  location: string
}

export default function AppRegistration() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false)
  const [keysGenerated, setKeysGenerated] = useState(false)
  const [privateKeyBase64, setPrivateKeyBase64] = useState<string>("")

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      organizationId: 0,
      password: "",
      repeatPassword: "",
      publicKey: "",
    },
  })

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchOrganizations = async () => {
      try {
        const response = await api.get<Organization[]>("/api/v1/org", {
          signal: controller.signal,
        })
        if (isMounted) {
          setOrganizations(response.data)
        }
      } catch (error) {
        if (error instanceof Error && error.name === "CanceledError") return
        console.error("Failed to fetch organizations:", error)
        if (isMounted) {
          setGlobalError("Failed to load organization directories.")
        }
      }
    }

    fetchOrganizations()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const handleGenerateKeys = async () => {
    setIsGeneratingKeys(true)
    setGlobalError(null)

    try {
      // Generate key pair
      const keyPair = await generateKeyPair()

      // Export keys
      const publicKeyBase64 = await exportPublicKey(keyPair.publicKey)
      const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey)

      // Store in state
      setPrivateKeyBase64(privateKeyBase64)
      setValue("publicKey", publicKeyBase64)
      setKeysGenerated(true)
    } catch (error) {
      console.error("Key generation failed:", error)
      setGlobalError("Failed to generate cryptographic keys. Please try again.")
    } finally {
      setIsGeneratingKeys(false)
    }
  }

  const handleDownloadPrivateKey = () => {
    if (!privateKeyBase64) return
    const email =
      (document.querySelector('input[type="email"]') as HTMLInputElement)
        ?.value || "user"
    downloadPrivateKey(privateKeyBase64, email)
  }

  const handleRegister: SubmitHandler<RegistrationFormValues> = async (
    data
  ) => {
    if (!keysGenerated) {
      setGlobalError("Please generate your cryptographic keys first.")
      return
    }

    setGlobalError(null)

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          organizationId: Number(data.organizationId),
          publicKey: data.publicKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.message ||
            "Registration failed. Please check your details."
        )
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGlobalError(err.message)
      } else {
        setGlobalError("An unexpected authentication error occurred.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]"></div>
        <div className="relative z-10 w-full max-w-112.5">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">
              <Shield className="h-3 w-3" /> Identity Enrollment
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Register to start managing your X.509 certificates.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
            <form className="space-y-5" onSubmit={handleSubmit(handleRegister)}>
              {/* Identity Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label icon={Fingerprint} label="First Name" />
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nikola"
                      {...register("firstName")}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                  {errors.firstName && (
                    <ErrorMsg msg={errors.firstName.message} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label icon={Fingerprint} label="Last Name" />
                  <input
                    type="text"
                    placeholder="Tesla"
                    {...register("lastName")}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                  {errors.lastName && (
                    <ErrorMsg msg={errors.lastName.message} />
                  )}
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-2">
                <Label icon={Mail} label="Email Address" />
                <div className="relative">
                  <input
                    type="email"
                    placeholder="tesla@trustanchor.com"
                    {...register("email")}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                {errors.email && <ErrorMsg msg={errors.email.message} />}
              </div>

              {/* Organization */}
              <div className="space-y-2">
                <Label icon={Building2} label="Organization Anchor" />
                <select
                  {...register("organizationId", { valueAsNumber: true })}
                  className="flex h-11 w-full appearance-none rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="0">Select entity...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {errors.organizationId && (
                  <ErrorMsg msg={errors.organizationId.message} />
                )}
              </div>

              {/* Cryptographic Keys */}
              <div className="space-y-2">
                <Label icon={Key} label="Cryptographic Identity" />
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
                    Generate RSA-2048 key pair for secure identity verification.
                    Your private key never leaves your device.
                  </p>

                  {!keysGenerated ? (
                    <button
                      type="button"
                      onClick={handleGenerateKeys}
                      disabled={isGeneratingKeys}
                      className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 py-2.5 text-sm font-bold text-cyan-600 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/10 disabled:opacity-50 dark:text-cyan-400"
                    >
                      <Key className="h-4 w-4" />
                      {isGeneratingKeys
                        ? "Generating Keys..."
                        : "Generate Key Pair"}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2 text-xs font-bold text-green-600 dark:text-green-400">
                        <Shield className="h-3 w-3" />
                        Keys generated successfully
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadPrivateKey}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        <Download className="h-4 w-4" />
                        Download Private Key
                      </button>
                      <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                        ⚠️ SAVE YOUR PRIVATE KEY - Required for account
                        activation
                      </p>
                    </div>
                  )}
                </div>
                {errors.publicKey && (
                  <ErrorMsg msg={errors.publicKey.message} />
                )}
              </div>

              {/* Passwords */}
              <div className="space-y-2">
                <Label icon={Lock} label="Master Password" />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimally 15 characters"
                    {...register("password")}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
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
                {errors.password && <ErrorMsg msg={errors.password.message} />}
              </div>

              <div className="space-y-2">
                <Label icon={Lock} label="Repeat Password" />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm master password"
                    {...register("repeatPassword")}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                {errors.repeatPassword && (
                  <ErrorMsg msg={errors.repeatPassword.message} />
                )}
              </div>

              {/* Errors */}
              {globalError && (
                <p className="text-center text-sm font-medium text-red-500">
                  {globalError}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !keysGenerated}
                className="group relative mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-3 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {isSubmitting ? "Enrolling Identity..." : "Register Identity"}
                {!isSubmitting && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Already have an identity?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="font-bold text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  Secure Login
                </button>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-600">
            By registering, you agree to our{" "}
            <span className="underline">
              CPS (Certification Practice Statement)
            </span>{" "}
            <br />
            and Zero-Knowledge Data Policy.
          </p>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 opacity-[0.05] dark:opacity-[0.1]">
          <Anchor
            size={600}
            strokeWidth={1}
            className="text-slate-900 dark:text-cyan-400"
          />
        </div>
      </main>
    </div>
  )
}

function Label({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
      <Icon size={12} className="text-cyan-600 dark:text-cyan-400" />
      {label}
    </div>
  )
}

function ErrorMsg({ msg }: { msg?: string }) {
  return (
    <p className="mt-1 text-[9px] font-bold tracking-tighter text-red-500 uppercase">
      {msg}
    </p>
  )
}
