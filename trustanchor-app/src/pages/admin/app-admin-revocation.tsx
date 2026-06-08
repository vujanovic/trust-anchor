import { useEffect, useState } from "react"
import { api } from "@/lib/axios.ts"

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
  status: "ACTIVE" | "REVOKED" | "EXPIRED"
  revokedAt: string | null
  revocationReason: string | null
  crlDistributionPoint: string
  createdAt: string
  isValid: boolean
  isCACertificate: boolean
  privateKeyDownloaded: boolean
  hasPrivateKey: boolean
}

export default function AppAdminRevocation() {
  const [revokedCertificates, setRevokedCertificates] = useState<Certificate[]>(
    []
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRevoked = async () => {
      try {
        const response = await api.get("/api/v1/certificates/revoked")
        const historicalList = response.data
        setRevokedCertificates(historicalList)
      } catch (err) {
        console.error("Failed loading revocation log", err)
      } finally {
        setLoading(false)
      }
    }
    fetchRevoked()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse p-8 font-mono text-xs text-muted-foreground">
        GENERATING CRL ENTRIES...
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl space-y-6 p-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground uppercase italic">
          Certificate Revocation List (CRL) Audit Log
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Historical tracking index containing compromised, superseded, or
          obsolete operational identities.
        </p>
      </div>

      <div className="overflow-hidden rounded-none border border-border bg-sidebar/40">
        <div className="grid grid-cols-5 gap-4 border-b border-border bg-muted/60 px-6 py-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          <div>Common Name</div>
          <div>Serial Number</div>
          <div>Type</div>
          <div>Revocation Reason</div>
          <div>Revoked Date</div>
        </div>

        {revokedCertificates.map((cert) => (
          <div
            key={cert.id}
            className="grid grid-cols-5 items-center gap-4 border-b border-border/40 px-6 py-4 font-mono text-xs transition-colors hover:bg-muted/20"
          >
            <div className="truncate font-sans font-bold text-foreground">
              {cert.commonName}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {cert.serialNumber}
            </div>
            <div>
              <span className="border border-border bg-sidebar px-2 py-0.5 text-[10px] tracking-tight text-muted-foreground uppercase">
                {cert.certificateType}
              </span>
            </div>
            <div className="text-[11px] font-bold text-red-500">
              {cert.revocationReason || "UNSPECIFIED"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {cert.revokedAt
                ? new Date(cert.revokedAt).toLocaleString()
                : "N/A"}
            </div>
          </div>
        ))}

        {revokedCertificates.length === 0 && (
          <div className="p-12 text-center font-sans text-xs text-muted-foreground">
            No revoked certificates found in the database. All systems secure.
          </div>
        )}
      </div>
    </div>
  )
}
