import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { StatCard } from "@/components/custom/stat-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Anchor,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Shield,
  Sun,
  User,
  XCircle,
} from "lucide-react"
import {
  getOrganizationCertificates,
  getAvailableIssuers,
  issueCertificate,
} from "@/service/certificate-service"
import type { CertificateDto } from "@/types/certificate"

const pad = (n: number) => String(n).padStart(2, "0")

const toDatetimeLocal = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

const toIso = (dtl: string) => `${dtl}:00`

type BoolExtKey =
  | "isCA"
  | "keyCertSign"
  | "crlSign"
  | "digitalSignature"
  | "keyEncipherment"
  | "dataEncipherment"
  | "nonRepudiation"

function makeForm() {
  return {
    issuerCertificateId: "",
    certificateType: "END_ENTITY" as "INTERMEDIATE" | "END_ENTITY",
    commonName: "",
    organizationName: "",
    organizationalUnit: "",
    country: "",
    email: "",
    notBefore: toDatetimeLocal(new Date()),
    notAfter: "",
    extensions: {
      isCA: false,
      keyCertSign: false,
      crlSign: false,
      digitalSignature: false,
      keyEncipherment: false,
      dataEncipherment: false,
      nonRepudiation: false,
      extendedKeyUsages: [] as string[],
    },
  }
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ACTIVE:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    REVOKED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    EXPIRED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls[status] ?? cls.EXPIRED}`}
    >
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const cls: Record<string, string> = {
    ROOT: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    INTERMEDIATE:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    END_ENTITY: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls[type] ?? cls.END_ENTITY}`}
    >
      {type.replace("_", " ")}
    </span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function AppCAUserMain() {
  const [activeTab, setActiveTab] = useState<"certs" | "issue">("certs")
  const [certs, setCerts] = useState<CertificateDto[]>([])
  const [issuers, setIssuers] = useState<CertificateDto[]>([])
  const [loadingCerts, setLoadingCerts] = useState(true) // true on mount — no effect needed
  const [issuersLoaded, setIssuersLoaded] = useState(false)
  const [form, setForm] = useState(makeForm)
  const [showExt, setShowExt] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const userName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
  const userEmail = user?.email ?? ""

  const loadCerts = () => {
    setLoadingCerts(true)
    getOrganizationCertificates()
      .then(setCerts)
      .finally(() => setLoadingCerts(false))
  }

  useEffect(() => {
    getOrganizationCertificates()
      .then(setCerts)
      .finally(() => setLoadingCerts(false))
  }, [])

  useEffect(() => {
    if (activeTab !== "issue" || issuersLoaded) return
    getAvailableIssuers().then((data) => {
      setIssuers(data)
      setIssuersLoaded(true)
    })
  }, [activeTab, issuersLoaded])

  const total = certs.length
  const active = certs.filter((c) => c.status === "ACTIVE").length
  const intermediate = certs.filter(
    (c) => c.certificateType === "INTERMEDIATE"
  ).length
  const endEntity = certs.filter(
    (c) => c.certificateType === "END_ENTITY"
  ).length

  const toggleDark = () => {
    setDarkMode((v) => !v)
    document.documentElement.classList.toggle("dark")
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  const patch = (field: string, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }))

  const patchExt = (field: string, value: unknown) =>
    setForm((p) => ({ ...p, extensions: { ...p.extensions, [field]: value } }))

  const toggleEku = (eku: string) =>
    setForm((p) => {
      const list = p.extensions.extendedKeyUsages
      return {
        ...p,
        extensions: {
          ...p.extensions,
          extendedKeyUsages: list.includes(eku)
            ? list.filter((e) => e !== eku)
            : [...list, eku],
        },
      }
    })

  const handleTypeChange = (type: "INTERMEDIATE" | "END_ENTITY") => {
    setForm((p) => ({
      ...p,
      certificateType: type,
      extensions: {
        ...p.extensions,
        isCA: type === "INTERMEDIATE",
        ...(type === "INTERMEDIATE" && { keyCertSign: true, crlSign: true }),
      },
    }))
    if (type === "INTERMEDIATE") setShowExt(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)
    setSubmitting(true)
    try {
      await issueCertificate({
        issuerCertificateId: Number(form.issuerCertificateId),
        certificateType: form.certificateType,
        commonName: form.commonName,
        organizationName: form.organizationName,
        organizationalUnit: form.organizationalUnit || undefined,
        country: form.country,
        email: form.email || undefined,
        notBefore: toIso(form.notBefore),
        notAfter: toIso(form.notAfter),
        extensions: form.extensions,
      })
      setSubmitSuccess(true)
      setForm(makeForm())
      loadCerts()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setSubmitError(msg ?? "Certificate issuance failed.")
    } finally {
      setSubmitting(false)
    }
  }

  const input =
    "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
  const lbl = "text-xs font-bold tracking-wider text-muted-foreground uppercase"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between py-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-cyan-500/20">
              <Anchor className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-lg leading-none font-bold tracking-tight">
                Trust<span className="text-primary">Anchor</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                CA Console
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm leading-none font-semibold text-foreground">
                  {userName}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDark}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="dot-grid mask-radial absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-widest text-primary uppercase">
            <Shield className="h-3 w-3" /> CERTIFICATE AUTHORITY
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Organization Certificates
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Issue and manage X.509 certificates for your organization's CA
            chain.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total"
            value={total}
            icon={Layers}
            accent="bg-muted text-muted-foreground"
          />
          <StatCard
            label="Active"
            value={active}
            icon={CheckCircle}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Intermediate"
            value={intermediate}
            icon={Shield}
            accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          />
          <StatCard
            label="End-Entity"
            value={endEntity}
            icon={XCircle}
            accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {[
            {
              id: "certs" as const,
              label: "Organization Certificates",
              icon: Shield,
            },
            { id: "issue" as const, label: "Issue Certificate", icon: Plus },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px rounded-none border-b-2 px-4 py-3 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab 1: Org Certificates */}
        {activeTab === "certs" && (
          <Card className="overflow-hidden fade-in">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <p className="text-sm font-bold text-card-foreground">
                Certificate List
              </p>
              <Button variant="ghost" size="sm" onClick={loadCerts}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
            {loadingCerts ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                Loading certificates...
              </div>
            ) : certs.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No certificates found for this organization.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Common Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid From</TableHead>
                    <TableHead>Valid Until</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certs.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">
                        {cert.commonName}
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={cert.certificateType} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={cert.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(cert.notBefore)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(cert.notAfter)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {/* Tab 2: Issue Certificate */}
        {activeTab === "issue" && (
          <Card className="p-6 fade-in">
            <h2 className="mb-6 text-base font-bold text-card-foreground">
              Issue New Certificate
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Issuer */}
              <div className="space-y-1.5">
                <label className={lbl}>Issuer Certificate *</label>
                <select
                  required
                  value={form.issuerCertificateId}
                  onChange={(e) => patch("issuerCertificateId", e.target.value)}
                  className={input}
                >
                  <option value="" disabled>
                    {!issuersLoaded
                      ? "Loading issuers..."
                      : "Select issuer certificate"}
                  </option>
                  {issuers.map((iss) => (
                    <option key={iss.id} value={iss.id}>
                      {iss.commonName} ({iss.certificateType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Certificate Type */}
              <div className="space-y-1.5">
                <label className={lbl}>Certificate Type *</label>
                <div className="flex gap-6">
                  {(["INTERMEDIATE", "END_ENTITY"] as const).map((type) => (
                    <label
                      key={type}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name="certificateType"
                        value={type}
                        checked={form.certificateType === type}
                        onChange={() => handleTypeChange(type)}
                        className="accent-primary"
                      />
                      {type.replace("_", " ")}
                    </label>
                  ))}
                </div>
              </div>

              {/* DN Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={lbl}>Common Name (CN) *</label>
                  <input
                    required
                    value={form.commonName}
                    onChange={(e) => patch("commonName", e.target.value)}
                    placeholder="e.g. My Service"
                    className={input}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Organization (O) *</label>
                  <input
                    required
                    value={form.organizationName}
                    onChange={(e) => patch("organizationName", e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className={input}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Organizational Unit (OU)</label>
                  <input
                    value={form.organizationalUnit}
                    onChange={(e) =>
                      patch("organizationalUnit", e.target.value)
                    }
                    placeholder="e.g. Engineering"
                    className={input}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Country (C) *</label>
                  <input
                    required
                    minLength={2}
                    maxLength={2}
                    value={form.country}
                    onChange={(e) =>
                      patch("country", e.target.value.toUpperCase())
                    }
                    placeholder="e.g. RS"
                    className={input}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className={lbl}>Email (E)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => patch("email", e.target.value)}
                    placeholder="e.g. admin@corp.com"
                    className={input}
                  />
                </div>
              </div>

              {/* Validity */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={lbl}>Valid From *</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.notBefore}
                    onChange={(e) => patch("notBefore", e.target.value)}
                    className={input}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Valid Until *</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.notAfter}
                    onChange={(e) => patch("notAfter", e.target.value)}
                    className={input}
                  />
                </div>
              </div>

              {/* Extensions (collapsible) */}
              <div className="rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setShowExt((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-foreground"
                >
                  Extensions
                  {showExt ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showExt && (
                  <div className="space-y-4 border-t border-border px-4 py-4">
                    {/* Basic Constraints */}
                    <div>
                      <p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Basic Constraints
                      </p>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.extensions.isCA}
                          onChange={(e) => patchExt("isCA", e.target.checked)}
                          className="accent-primary"
                        />
                        CA Certificate (BasicConstraints isCA=true)
                      </label>
                    </div>

                    {/* Key Usage */}
                    <div>
                      <p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Key Usage
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {(
                          [
                            { field: "keyCertSign", label: "Key Cert Sign" },
                            { field: "crlSign", label: "CRL Sign" },
                            {
                              field: "digitalSignature",
                              label: "Digital Signature",
                            },
                            {
                              field: "keyEncipherment",
                              label: "Key Encipherment",
                            },
                            {
                              field: "dataEncipherment",
                              label: "Data Encipherment",
                            },
                            {
                              field: "nonRepudiation",
                              label: "Non-Repudiation",
                            },
                          ] as { field: BoolExtKey; label: string }[]
                        ).map(({ field, label }) => (
                          <label
                            key={field}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={form.extensions[field]}
                              onChange={(e) =>
                                patchExt(field, e.target.checked)
                              }
                              className="accent-primary"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Extended Key Usage */}
                    <div>
                      <p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Extended Key Usage
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          { value: "serverAuth", label: "Server Auth" },
                          { value: "clientAuth", label: "Client Auth" },
                          {
                            value: "emailProtection",
                            label: "Email Protection",
                          },
                          { value: "codeSigning", label: "Code Signing" },
                        ].map(({ value, label }) => (
                          <label
                            key={value}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={form.extensions.extendedKeyUsages.includes(
                                value
                              )}
                              onChange={() => toggleEku(value)}
                              className="accent-primary"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {submitError && (
                <p className="rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p className="rounded-md bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                  Certificate issued successfully.
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? "Issuing..." : "Issue Certificate"}
              </Button>
            </form>
          </Card>
        )}
      </div>

      <footer className="mt-16 border-t border-border px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          IB Trust Anchor · X.509 PKI Platform · SIIT 2026
        </p>
      </footer>
    </div>
  )
}
