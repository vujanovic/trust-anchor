import { useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const certificates = [
  {
    id: "7d2f-4a12",
    subject: "TrustAnchor Root G1",
    issuer: "Self-Signed",
    type: "ROOT",
    status: "VALID",
    expiry: "2034-12-31",
    thumbprint: "A1:B2:C3:D4:E5:F6:G7:H8:I9:J0",
  },
  {
    id: "a4b8-2c91",
    subject: "SIIT Intermediate CA",
    issuer: "TrustAnchor Root G1",
    type: "INTERMEDIATE",
    status: "VALID",
    expiry: "2029-06-15",
    thumbprint: "Z1:Y2:X3:W4:V5:U6:T7:S8:R9:Q0",
  },
  {
    id: "e9d1-3f42",
    subject: "vpn.siit.rs",
    issuer: "SIIT Intermediate CA",
    type: "END-ENTITY",
    status: "REVOKED",
    expiry: "2025-03-10",
    thumbprint: "K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0",
  },
]

export default function AppAdminCertificates() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get("id")

  useEffect(() => {
    if (!selectedId && certificates.length > 0) {
      setSearchParams({ id: certificates[0].id }, { replace: true })
    }
  }, [selectedId, setSearchParams])

  const selectedCert = certificates.find((c) => c.id === selectedId)

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
              placeholder="Search by CN or Thumbprint..."
              className="h-9 rounded-none border-sidebar-border bg-sidebar/50 pl-8 focus-visible:ring-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {certificates.map((cert) => (
            <button
              key={cert.id}
              onClick={() => setSearchParams({ id: cert.id })}
              className={`group flex w-full flex-col border-b border-sidebar-border/50 p-5 text-left transition-all hover:bg-sidebar-accent/30 ${
                selectedId === cert.id
                  ? "border-l-2 border-l-primary bg-sidebar-accent/60"
                  : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`max-w-45 truncate font-bold tracking-tight ${selectedId === cert.id ? "text-primary" : "text-sidebar-foreground"}`}
                >
                  {cert.subject}
                </span>
              </div>
              <div className="mt-1 flex w-full items-center justify-between">
                <span className="text-[10px] tracking-tighter text-muted-foreground uppercase">
                  Type: {cert.type}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {cert.expiry}
                </span>
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* DESNA STRANA: Certificate Details */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-sidebar">
        {selectedCert ? (
          <div className="flex h-full w-full flex-col">
            {/* Toolbar sa akcijama */}
            <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar-accent/5 px-8 py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {selectedCert.status === "VALID" ? (
                    <ShieldCheck className="size-4 text-emerald-500" />
                  ) : (
                    <ShieldX className="size-4 text-destructive" />
                  )}
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    Certificate Info
                  </span>
                </div>
                <Separator
                  orientation="vertical"
                  className="h-4 bg-sidebar-border"
                />
                <span className="font-mono text-[10px] text-muted-foreground">
                  SN: {selectedCert.id}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-sidebar-border"
                >
                  <Download className="mr-2 size-3" /> Export (.crt)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-sidebar-border transition-colors hover:bg-destructive/20 hover:text-destructive"
                >
                  <ShieldAlert className="mr-2 size-3" /> Revoke
                </Button>
              </div>
            </div>

            <ScrollArea className="w-full flex-1">
              <div className="w-full max-w-5xl p-12">
                {/* Header: Subject & Issuer */}
                <div className="mb-16 flex items-start gap-8">
                  <div className="flex size-24 items-center justify-center border border-sidebar-border bg-sidebar-accent text-primary shadow-xl">
                    <FileText className="size-12" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-4xl font-black tracking-tighter text-sidebar-foreground uppercase italic">
                        {selectedCert.subject}
                      </h1>
                      <div className="mt-2 flex items-center gap-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
                          <ArrowDownLeft className="size-3 text-primary" />{" "}
                          Issued by:{" "}
                          <span className="font-semibold text-sidebar-foreground">
                            {selectedCert.issuer}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
                  {/* Sekcija 1: Validity & Chain */}
                  <section className="space-y-8">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      Temporal & Status
                    </h3>
                    <div className="space-y-6">
                      <DetailBlock
                        icon={Calendar}
                        label="Not Before"
                        value="2024-01-01 00:00:00 UTC"
                      />
                      <DetailBlock
                        icon={Calendar}
                        label="Not After (Expiry)"
                        value={`${selectedCert.expiry} 23:59:59 UTC`}
                      />
                      <DetailBlock
                        icon={KeyRound}
                        label="Public Key"
                        value="RSA 4096 bits (Modulus: 512 bytes)"
                      />
                    </div>
                  </section>

                  {/* Sekcija 2: Fingerprints & Storage */}
                  <section className="space-y-8">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      Cryptography
                    </h3>
                    <div className="space-y-6">
                      <DetailBlock
                        icon={Fingerprint}
                        label="SHA-256 Fingerprint"
                        value={selectedCert.thumbprint}
                        isMono
                      />
                      <DetailBlock
                        icon={HardDrive}
                        label="Signature Algorithm"
                        value="sha256WithRSAEncryption"
                      />
                      <DetailBlock
                        icon={ExternalLink}
                        label="CRL Distribution Point"
                        value={`https://pki.trustanchor.com/crl/${selectedCert.id}.crl`}
                      />
                    </div>
                  </section>
                </div>

                {/* X.509 Extensions Preview */}
                <div className="mt-16 border border-sidebar-border bg-sidebar-accent/10 p-8">
                  <h4 className="mb-6 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    X.509 v3 Extensions
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 font-mono text-xs">
                    <div className="text-muted-foreground">
                      Basic Constraints:
                    </div>
                    <div className="font-bold text-sidebar-foreground">
                      {selectedCert.type === "END-ENTITY"
                        ? "Subject Type=End Entity, pathLenConstraint=None"
                        : "Subject Type=CA"}
                    </div>

                    <div className="text-muted-foreground">Key Usage:</div>
                    <div className="text-sidebar-foreground">
                      Digital Signature, Non-Repudiation, Key Encipherment
                    </div>

                    <div className="text-muted-foreground">
                      Subject Alt Name:
                    </div>
                    <div className="cursor-pointer truncate text-primary underline">
                      DNS:{selectedCert.subject}
                    </div>
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
