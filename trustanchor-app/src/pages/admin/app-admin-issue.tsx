import { useEffect, useState } from "react"
import { AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/axios.ts"
import { useToast } from "@/hooks/use-toast"

interface CertificateDto {
  id: number
  commonName: string
  organizationName: string
  certificateType: "ROOT" | "INTERMEDIATE" | "END_ENTITY"
  notBefore: string
  notAfter: string
  status: string
}

interface ExtensionsDto {
  isCA: boolean
  keyCertSign: boolean
  crlSign: boolean
  digitalSignature: boolean
  keyEncipherment: boolean
  dataEncipherment: boolean
  nonRepudiation: boolean
  extendedKeyUsages: string[]
}

const toIso = (dtl: string) => `${dtl}:00`

const formatDateTimeLocal = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function AppAdminIssue() {
  const { toast } = useToast()

  const [certType, setCertType] = useState<
    "ROOT" | "INTERMEDIATE" | "END_ENTITY"
  >("END_ENTITY")
  const [issuerCertId, setIssuerCertId] = useState<string>("")
  const [issuers, setIssuers] = useState<CertificateDto[]>([])
  const [loadingIssuers, setLoadingIssuers] = useState(false)
  const [issuing, setIssuing] = useState(false)

  const [formData, setFormData] = useState(() => {
    const now = Date.now()
    return {
      commonName: "",
      organizationName: "",
      organizationalUnit: "",
      country: "",
      email: "",
      notBefore: formatDateTimeLocal(new Date(now)),
      notAfter: formatDateTimeLocal(new Date(now + 365 * 24 * 60 * 60 * 1000)),
    }
  })

  const [extensions, setExtensions] = useState<ExtensionsDto>({
    isCA: false,
    keyCertSign: false,
    crlSign: false,
    digitalSignature: true,
    keyEncipherment: false,
    dataEncipherment: false,
    nonRepudiation: false,
    extendedKeyUsages: [],
  })

  useEffect(() => {
    if (certType === "ROOT") return

    const fetchIssuers = async () => {
      setLoadingIssuers(true)
      try {
        const res = await api.get("/api/v1/certificates/issuers")
        const availableIssuers = res.data || []
        setIssuers(availableIssuers)
        if (availableIssuers.length > 0) {
          setIssuerCertId(String(availableIssuers[0].id))
        }
      } catch {
        toast({ message: "Failed to load issuers.", variant: "error" })
      } finally {
        setLoadingIssuers(false)
      }
    }

    fetchIssuers()
  }, [certType, toast])

  const handleCertTypeChange = (
    newType: "ROOT" | "INTERMEDIATE" | "END_ENTITY"
  ) => {
    setCertType(newType)
    const isAuthority = newType === "ROOT" || newType === "INTERMEDIATE"

    setExtensions((prev) => ({
      ...prev,
      isCA: isAuthority,
      keyCertSign: isAuthority,
      crlSign: isAuthority,
    }))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleExtensionToggle = (ext: keyof ExtensionsDto) => {
    setExtensions((prev) => ({
      ...prev,
      [ext]: typeof prev[ext] === "boolean" ? !prev[ext] : prev[ext],
    }))
  }

  const handleEKU = (eku: string) => {
    setExtensions((prev) => {
      const exists = prev.extendedKeyUsages.includes(eku)
      return {
        ...prev,
        extendedKeyUsages: exists
          ? prev.extendedKeyUsages.filter((e) => e !== eku)
          : [...prev.extendedKeyUsages, eku],
      }
    })
  }

  const handleSubmit = async () => {
    setIssuing(true)
    try {
      const payload = {
        issuerCertificateId: certType === "ROOT" ? null : Number(issuerCertId),
        certificateType: certType,
        commonName: formData.commonName,
        organizationName: formData.organizationName,
        organizationalUnit: formData.organizationalUnit || undefined,
        country: formData.country,
        email: formData.email || undefined,
        notBefore: toIso(formData.notBefore),
        notAfter: toIso(formData.notAfter),
        extensions: {
          isCA: extensions.isCA,
          keyCertSign: extensions.keyCertSign,
          crlSign: extensions.crlSign,
          digitalSignature: extensions.digitalSignature,
          keyEncipherment: extensions.keyEncipherment,
          dataEncipherment: extensions.dataEncipherment,
          nonRepudiation: extensions.nonRepudiation,
          extendedKeyUsages: extensions.extendedKeyUsages,
        },
      }

      const res = await api.post("/api/v1/certificates/issue", payload)
      toast({
        message: `Certificate "${res.data.commonName}" issued successfully.`,
        variant: "success",
      })

      setFormData({
        commonName: "",
        organizationName: "",
        organizationalUnit: "",
        country: "",
        email: "",
        notBefore: formatDateTimeLocal(new Date()),
        notAfter: formatDateTimeLocal(
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        ),
      })
      setExtensions({
        isCA: false,
        keyCertSign: false,
        crlSign: false,
        digitalSignature: true,
        keyEncipherment: false,
        dataEncipherment: false,
        nonRepudiation: false,
        extendedKeyUsages: [],
      })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data
      const msg =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message: string }).message
          : typeof data === "object" && data !== null
            ? Object.values(data as Record<string, string>).join(", ")
            : "Certificate issuance failed."
      toast({ message: msg, variant: "error" })
    } finally {
      setIssuing(false)
    }
  }

  const isFormValid = () => {
    if (!formData.commonName || !formData.organizationName || !formData.country)
      return false
    if (formData.country.length !== 2) return false
    if (certType !== "ROOT" && !issuerCertId) return false
    if (!formData.notBefore || !formData.notAfter) return false
    return new Date(formData.notBefore) < new Date(formData.notAfter)
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-sidebar">
      <div className="border-b border-sidebar-border bg-sidebar-accent/5 px-12 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Issue New Certificate
          </h1>
          <p className="text-muted-foreground">
            X.509 v3 Standard Compliant Issuance Engine
          </p>
        </div>
      </div>
      <div className="flex-1 px-12 py-4">
        <div className="max-w-4xl space-y-12 pb-24">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                01
              </div>
              <h2 className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
                Issuance Chain
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Certificate Type
                </Label>
                <Select
                  onValueChange={(v) =>
                    handleCertTypeChange(
                      v as "ROOT" | "INTERMEDIATE" | "END_ENTITY"
                    )
                  }
                  defaultValue="END_ENTITY"
                >
                  <SelectTrigger className="h-12 rounded-none border-sidebar-border bg-sidebar-accent/20 text-sm font-semibold focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-sidebar-border bg-sidebar">
                    <SelectItem value="ROOT">ROOT CA (Self-Signed)</SelectItem>
                    <SelectItem value="INTERMEDIATE">
                      INTERMEDIATE CA
                    </SelectItem>
                    <SelectItem value="END_ENTITY">
                      END-ENTITY (User/Device)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {certType !== "ROOT" && (
                <div className="space-y-2">
                  <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                    Signing Issuer (CA)
                  </Label>
                  <Select onValueChange={setIssuerCertId} value={issuerCertId}>
                    <SelectTrigger className="h-12 rounded-none border-sidebar-border bg-sidebar-accent/20 text-sm font-semibold">
                      <SelectValue placeholder="Select Parent CA..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-sidebar-border bg-sidebar">
                      {loadingIssuers ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : issuers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No CA certificates available
                        </SelectItem>
                      ) : (
                        issuers.map((cert) => (
                          <SelectItem key={cert.id} value={String(cert.id)}>
                            {cert.commonName} ({cert.certificateType})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                02
              </div>
              <h2 className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
                Subject Details (X.500 Name)
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Common Name (CN) *
                </Label>
                <Input
                  value={formData.commonName}
                  onChange={(e) =>
                    handleInputChange("commonName", e.target.value)
                  }
                  placeholder="e.g. server.example.com"
                  className="h-11 rounded-none border-sidebar-border bg-sidebar-accent/10 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Organization (O) *
                </Label>
                <Input
                  value={formData.organizationName}
                  onChange={(e) =>
                    handleInputChange("organizationName", e.target.value)
                  }
                  placeholder="e.g. My Company LLC"
                  className="h-11 rounded-none border-sidebar-border bg-sidebar-accent/10 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Organizational Unit (OU)
                </Label>
                <Input
                  value={formData.organizationalUnit}
                  onChange={(e) =>
                    handleInputChange("organizationalUnit", e.target.value)
                  }
                  placeholder="e.g. IT Department"
                  className="h-11 rounded-none border-sidebar-border bg-sidebar-accent/10 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Country (C) *
                </Label>
                <Input
                  value={formData.country}
                  onChange={(e) =>
                    handleInputChange("country", e.target.value.toUpperCase())
                  }
                  placeholder="e.g. RS"
                  maxLength={2}
                  className="h-11 rounded-none border-sidebar-border bg-sidebar-accent/10 uppercase focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Email (E)
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="e.g. admin@example.com"
                  className="h-11 rounded-none border-sidebar-border bg-sidebar-accent/10 focus-visible:ring-primary"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                03
              </div>
              <h2 className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
                Validity Period
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Not Before
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.notBefore}
                  onChange={(e) =>
                    handleInputChange("notBefore", e.target.value)
                  }
                  className="h-11 rounded-none border-sidebar-border bg-sidebar-accent/10 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Not After
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.notAfter}
                  onChange={(e) =>
                    handleInputChange("notAfter", e.target.value)
                  }
                  className="h-11 rounded-none border-sidebar-border bg-sidebar-accent/10 font-mono"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                04
              </div>
              <h2 className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
                Extensions
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between border border-sidebar-border bg-sidebar-accent/10 p-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      Basic Constraints (CA)
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Certificate is a Certificate Authority
                    </p>
                  </div>
                  <Switch
                    checked={extensions.isCA}
                    onCheckedChange={() => handleExtensionToggle("isCA")}
                    disabled={certType === "END_ENTITY"}
                  />
                </div>

                <div className="flex items-center justify-between border border-sidebar-border bg-sidebar-accent/10 p-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      Key Cert Sign
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Can sign other certificates
                    </p>
                  </div>
                  <Switch
                    checked={extensions.keyCertSign}
                    onCheckedChange={() => handleExtensionToggle("keyCertSign")}
                    disabled={certType === "END_ENTITY"}
                  />
                </div>

                <div className="flex items-center justify-between border border-sidebar-border bg-sidebar-accent/10 p-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      CRL Sign
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Can sign Certificate Revocation Lists
                    </p>
                  </div>
                  <Switch
                    checked={extensions.crlSign}
                    onCheckedChange={() => handleExtensionToggle("crlSign")}
                    disabled={certType === "END_ENTITY"}
                  />
                </div>

                <div className="flex items-center justify-between border border-sidebar-border bg-sidebar-accent/10 p-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      Digital Signature
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Can sign data/documents
                    </p>
                  </div>
                  <Switch
                    checked={extensions.digitalSignature}
                    onCheckedChange={() =>
                      handleExtensionToggle("digitalSignature")
                    }
                  />
                </div>

                <div className="flex items-center justify-between border border-sidebar-border bg-sidebar-accent/10 p-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      Key Encipherment
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Can encrypt other keys
                    </p>
                  </div>
                  <Switch
                    checked={extensions.keyEncipherment}
                    onCheckedChange={() =>
                      handleExtensionToggle("keyEncipherment")
                    }
                  />
                </div>

                <div className="flex items-center justify-between border border-sidebar-border bg-sidebar-accent/10 p-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      Non-Repudiation
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Provides non-repudiation
                    </p>
                  </div>
                  <Switch
                    checked={extensions.nonRepudiation}
                    onCheckedChange={() =>
                      handleExtensionToggle("nonRepudiation")
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Extended Key Usage (EKU)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: "serverAuth",
                      label: "Server Authentication",
                      desc: "TLS server certificates",
                    },
                    {
                      id: "clientAuth",
                      label: "Client Authentication",
                      desc: "TLS client certificates",
                    },
                    {
                      id: "emailProtection",
                      label: "Email Protection",
                      desc: "S/MIME email",
                    },
                    {
                      id: "codeSigning",
                      label: "Code Signing",
                      desc: "Software signing",
                    },
                  ].map((eku) => (
                    <div
                      key={eku.id}
                      className={`flex cursor-pointer items-center justify-between border p-3 transition-colors ${
                        extensions.extendedKeyUsages.includes(eku.id)
                          ? "border-primary bg-primary/10"
                          : "border-sidebar-border bg-sidebar-accent/10 hover:bg-sidebar-accent/20"
                      }`}
                      onClick={() => handleEKU(eku.id)}
                    >
                      <div>
                        <p className="text-xs font-semibold">{eku.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {eku.desc}
                        </p>
                      </div>
                      <div
                        className={`size-4 rounded-full border-2 ${
                          extensions.extendedKeyUsages.includes(eku.id)
                            ? "border-primary bg-primary"
                            : "border-muted"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-sidebar-border pt-12">
            <Card className="rounded-none border-sidebar-border bg-sidebar-accent/10 shadow-none">
              <CardContent className="flex items-start gap-4 p-6">
                <Info className="mt-1 size-5 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-bold tracking-tight uppercase">
                    Pre-Issuance Validation
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    System will verify the signing CA's digital signature,
                    revocation status (CRL/OCSP), and ensure the validity period
                    does not exceed the issuer's expiration date. For ROOT
                    certificates, a self-signed certificate will be generated.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || issuing}
              className="flex-1 rounded-none bg-primary px-12 py-6 font-black tracking-[0.2em] text-primary-foreground uppercase shadow-2xl shadow-primary/30 transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 md:flex-none"
            >
              {issuing ? "Issuing..." : "Generate & Sign Certificate"}
            </Button>
            {!isFormValid() && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="size-4" />
                <span>Fill all required fields</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
