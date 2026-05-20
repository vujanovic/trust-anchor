import { useEffect, useState } from "react"
import { CertificateTable } from "@/components/custom/certificate-table"
import { StatCard } from "@/components/custom/stat-card"
import { RequestTab } from "@/components/custom/request-tab"
import { RevocationModal } from "./dialog/revocation-modal"
import { DownloadCertificateSheet } from "./dialog/download-certificate-sheet"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Shield,
  Plus,
  Key,
  Layers,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  User,
  Anchor,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useNavigate } from "react-router-dom"
import { getMyCertificates } from "@/service/certificate-service"
import type { CertificateDto } from "@/types/certificate"
import { MfaSettingsModal } from "./dialog/mfa-settings-modal"

const MOCK_CAS = [
  {
    id: "ca-1",
    name: "IB Corp Intermediate CA",
    type: "Intermediate",
    usage: "Email / Client Auth",
  },
  {
    id: "ca-2",
    name: "IB Corp VPN CA",
    type: "Intermediate",
    usage: "VPN / Remote Access",
  },
  {
    id: "ca-3",
    name: "IB Corp Code Sign CA",
    type: "Intermediate",
    usage: "Code Signing",
  },
]

export default function AppUserMain() {
  const [activeTab, setActiveTab] = useState<"certs" | "request">("certs")
  const [certs, setCerts] = useState<CertificateDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revoking, setRevoking] = useState<CertificateDto | null>(null)
  const [downloading, setDownloading] = useState<CertificateDto | null>(null)
  const [darkMode, setDarkMode] = useState(true)

  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const [mfaOpen, setMfaOpen] = useState(false)

  useEffect(() => {
    const fetchCertificates = async () => {
      setIsLoading(true)
      try {
        const data = await getMyCertificates()
        setCerts(data)
      } catch (error) {
        console.error("Failed to fetch:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCertificates()
  }, [])

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const data = await getMyCertificates()
      setCerts(data)
    } catch (error) {
      console.error("Failed to fetch:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const userName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
  const userEmail = user?.email ?? ""

  const activeCerts = certs.filter((c) => c.status === "ACTIVE").length
  const expiredCerts = certs.filter((c) => c.status === "EXPIRED").length
  const revokedCerts = certs.filter((c) => c.status === "REVOKED").length

  const handleRevoke = (cert: CertificateDto) => {
    setRevoking(cert)
  }

  const confirmRevoke = () => {
    if (!revoking) return
    setCerts((prev) =>
      prev.map((c) =>
        c.id === revoking.id ? { ...c, status: "REVOKED" as const } : c
      )
    )
    setRevoking(null)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-cyan-500/20">
              <Anchor className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-lg leading-none font-bold tracking-tight">
                Trust<span className="text-primary">Anchor</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                User Console
              </span>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-4">
            {/* User Info */}
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

            <Button variant="ghost" onClick={() => setMfaOpen(true)} className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Toggle 2FA</span>
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Logout Button */}
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
            <Key className="h-3 w-3" /> MANAGE YOUR CERTIFICATES
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            My Certificates
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            View, download, and manage your personal X.509 end-entity
            certificates. Revoke or request new ones at any time.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total"
            value={certs.length}
            icon={Layers}
            accent="bg-muted text-muted-foreground"
          />
          <StatCard
            label="Active"
            value={activeCerts}
            icon={CheckCircle}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Expired"
            value={expiredCerts}
            icon={Clock}
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Revoked"
            value={revokedCerts}
            icon={XCircle}
            accent="bg-red-500/10 text-red-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {[
            { id: "certs" as const, label: "My Certificates", icon: Shield },
            {
              id: "request" as const,
              label: "Request Certificate",
              icon: Plus,
            },
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

        {/* Tab content */}
        {activeTab === "certs" && (
          <Card className="overflow-hidden fade-in">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <p className="text-sm font-bold text-card-foreground">
                Certificate List
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <CertificateTable
                certs={certs}
                onRevoke={handleRevoke}
                onDownload={(cert) => setDownloading(cert)}
              />
            )}
          </Card>
        )}

        {activeTab === "request" && (
          <Card className="p-6 fade-in">
            <RequestTab cas={MOCK_CAS} />
          </Card>
        )}
      </div>

      <DownloadCertificateSheet
        cert={downloading}
        open={!!downloading}
        onClose={() => setDownloading(null)}
        onDownloaded={(certId) =>
          setCerts((prev) =>
            prev.map((c) =>
              c.id === certId
                ? { ...c, privateKeyDownloaded: true, hasPrivateKey: false }
                : c
            )
          )
        }
      />

      {/* Revocation Modal */}
      {revoking && (
        <RevocationModal
          cert={revoking}
          onClose={() => setRevoking(null)}
          onConfirm={confirmRevoke}
        />
      )}

      <MfaSettingsModal 
        open={mfaOpen} 
        onClose={() => setMfaOpen(false)} 
      />

      <footer className="mt-16 border-t border-border px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          IB Trust Anchor · X.509 PKI Platform · SIIT 2026
        </p>
      </footer>
    </div>
  )
}
