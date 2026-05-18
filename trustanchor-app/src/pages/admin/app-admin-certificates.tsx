import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowDownLeft,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Fingerprint,
  HardDrive,
  KeyRound,
  type LucideIcon,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/axios.ts"
import { DownloadCertificateSheet } from "@/pages/user/dialog/download-certificate-sheet"
import type { CertificateDto } from "@/types/certificate"

interface Certificate {
  id: number
  serialNumber: string
  commonName: string
  organizationName: string
  organizationalUnit: string
  country: string
  email: string
  certificateType: "ROOT" | "INTERMEDIATE" | "END_ENTITY"
  notBefore: string
  notAfter: string
  status: "VALID" | "REVOKED" | "EXPIRED"
  revokedAt: string | null
  revocationReason: string | null
  crlDistributionPoint: string
  createdAt: string
  isValid: boolean
  isCACertificate: boolean
  privateKeyDownloaded: boolean
  hasPrivateKey: boolean
}

export default function AppAdminCertificates() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get("id")

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [downloading, setDownloading] = useState<CertificateDto | null>(null)

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await api.get("/api/v1/certificates")
        setCertificates(response.data)
      } catch (error) {
        console.error("Failed to fetch certificates", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCertificates()
  }, [])

  useEffect(() => {
    if (!selectedId && certificates.length > 0) {
      setSearchParams({ id: certificates[0].id.toString() }, { replace: true })
    }
  }, [selectedId, certificates, setSearchParams])

  const selectedCert = certificates.find((c) => c.id.toString() === selectedId)

  const filteredCertificates = certificates.filter(
    (c) =>
      c.commonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-1 items-center justify-center bg-sidebar">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs font-bold tracking-[0.2em] uppercase">
            Fetching Registry...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-1 overflow-hidden bg-sidebar">
      <div className="flex w-96 flex-none flex-col border-r border-sidebar-border bg-sidebar-accent/5">
        <div className="space-y-4 border-b border-sidebar-border p-4">
          <h2 className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
            Registry
          </h2>
          <div className="relative">
            <Search className="absolute top-2.5 left-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by CN or Serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-none border-sidebar-border bg-sidebar/50 pl-8 focus-visible:ring-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredCertificates.map((cert) => (
            <button
              key={cert.id}
              onClick={() => setSearchParams({ id: cert.id.toString() })}
              className={`group flex w-full flex-col border-b border-sidebar-border/50 p-5 text-left transition-all hover:bg-sidebar-accent/30 ${
                selectedId === cert.id.toString()
                  ? "border-l-2 border-l-primary bg-sidebar-accent/60"
                  : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`max-w-45 truncate font-bold tracking-tight ${selectedId === cert.id.toString() ? "text-primary" : "text-sidebar-foreground"}`}
                >
                  {cert.commonName}
                </span>
              </div>
              <div className="mt-1 flex w-full items-center justify-between">
                <span className="text-[10px] tracking-tighter text-muted-foreground uppercase">
                  Type: {cert.certificateType.replace("_", "-")}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Exp: {new Date(cert.notAfter).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
          {filteredCertificates.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No certificates found.
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden bg-sidebar">
        {selectedCert ? (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar-accent/5 px-8 py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {selectedCert.status === "VALID" ? (
                    <ShieldCheck className="size-4 text-emerald-500" />
                  ) : (
                    <ShieldX className="size-4 text-destructive" />
                  )}
                  <span
                    className={`text-[10px] font-bold tracking-widest uppercase ${selectedCert.status === "VALID" ? "text-emerald-500" : "text-destructive"}`}
                  >
                    {selectedCert.status}
                  </span>
                </div>
                <Separator
                  orientation="vertical"
                  className="h-4 bg-sidebar-border"
                />
                <span className="font-mono text-[10px] text-muted-foreground">
                  SN: {selectedCert.serialNumber}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-sidebar-border"
                  onClick={() =>
                    setDownloading(selectedCert as unknown as CertificateDto)
                  }
                >
                  <Download className="mr-2 size-3" /> Download
                </Button>
                {selectedCert.status === "VALID" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none border-sidebar-border transition-colors hover:bg-destructive/20 hover:text-destructive"
                  >
                    <ShieldAlert className="mr-2 size-3" /> Revoke
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="w-full flex-1">
              <div className="w-full max-w-5xl p-12">
                <div className="mb-16 flex items-start gap-8">
                  <div className="flex size-24 items-center justify-center border border-sidebar-border bg-sidebar-accent text-primary shadow-xl">
                    <FileText className="size-12" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-4xl font-black tracking-tighter text-sidebar-foreground uppercase italic">
                        {selectedCert.commonName}
                      </h1>
                      <div className="mt-2 flex items-center gap-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
                          <ArrowDownLeft className="size-3 text-primary" />{" "}
                          Organization:{" "}
                          <span className="font-semibold text-sidebar-foreground">
                            {selectedCert.organizationName || "N/A"} (
                            {selectedCert.country})
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
                  <section className="space-y-8">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      Temporal & Entity
                    </h3>
                    <div className="space-y-6">
                      <DetailBlock
                        icon={Calendar}
                        label="Not Before"
                        value={formatDate(selectedCert.notBefore)}
                      />
                      <DetailBlock
                        icon={Calendar}
                        label="Not After (Expiry)"
                        value={formatDate(selectedCert.notAfter)}
                      />
                      <DetailBlock
                        icon={HardDrive}
                        label="Organizational Unit"
                        value={selectedCert.organizationalUnit || "None"}
                      />
                    </div>
                  </section>

                  <section className="space-y-8">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      Cryptography
                    </h3>
                    <div className="space-y-6">
                      <DetailBlock
                        icon={Fingerprint}
                        label="Serial Number (Hex)"
                        value={selectedCert.serialNumber}
                        isMono
                      />
                      <DetailBlock
                        icon={KeyRound}
                        label="System Identity"
                        value={selectedCert.email || "No Email Bound"}
                      />
                      <DetailBlock
                        icon={ExternalLink}
                        label="CRL Distribution Point"
                        value={
                          selectedCert.crlDistributionPoint || "Not Configured"
                        }
                        isMono
                      />
                    </div>
                  </section>
                </div>
                <div className="mt-16 border border-sidebar-border bg-sidebar-accent/10 p-8">
                  <h4 className="mb-6 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    X.509 v3 Extensions & Meta
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 font-mono text-xs">
                    <div className="text-muted-foreground">
                      Basic Constraints:
                    </div>
                    <div className="font-bold text-sidebar-foreground">
                      {selectedCert.isCACertificate
                        ? "Subject Type=CA, pathLenConstraint=None"
                        : "Subject Type=End Entity"}
                    </div>

                    <div className="text-muted-foreground">
                      Type Classifier:
                    </div>
                    <div className="text-sidebar-foreground">
                      {selectedCert.certificateType}
                    </div>

                    <div className="text-muted-foreground">
                      Subject Alt Name:
                    </div>
                    <div className="truncate">
                      DNS:{selectedCert.commonName}
                    </div>

                    {selectedCert.status === "REVOKED" &&
                      selectedCert.revocationReason && (
                        <>
                          <div className="text-red-500">Revocation Reason:</div>
                          <div className="font-bold text-red-500">
                            {selectedCert.revocationReason} @{" "}
                            {formatDate(selectedCert.revokedAt!)}
                          </div>
                        </>
                      )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-20 items-center justify-center border border-sidebar-border bg-sidebar-accent/10">
                <ShieldCheck className="size-8 text-muted-foreground/20" />
              </div>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                Select a certificate to inspect the chain
              </p>
            </div>
          </div>
        )}
      </div>

      <DownloadCertificateSheet
        cert={downloading}
        open={!!downloading}
        onClose={() => setDownloading(null)}
        onDownloaded={(certId) => {
          setCertificates((prev) =>
            prev.map((c) =>
              c.id === certId
                ? { ...c, privateKeyDownloaded: true, hasPrivateKey: false }
                : c
            )
          )
          setDownloading(null)
        }}
      />
    </div>
  )
}

function DetailBlock({
  icon: Icon,
  label,
  value,
  isMono = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  isMono?: boolean
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 text-primary">
        <Icon size={16} />
      </div>
      <div className="space-y-1">
        <p className="text-[9px] leading-none font-bold tracking-widest text-muted-foreground/50 uppercase">
          {label}
        </p>
        <p
          className={`text-sm font-semibold tracking-tight text-sidebar-foreground ${isMono ? "font-mono text-[11px] break-all" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
