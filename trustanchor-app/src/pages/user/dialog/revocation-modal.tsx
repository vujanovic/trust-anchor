import { useState } from "react"
import { ShieldAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CertificateDto } from "@/types/certificate"
import { api } from "@/lib/axios"

const REVOCATION_REASONS = [
  { value: "UNSPECIFIED", label: "Unspecified" },
  { value: "KEY_COMPROMISE", label: "Key Compromise" },
  { value: "CA_COMPROMISE", label: "CA Compromise" },
  { value: "AFFILIATION_CHANGE", label: "Affiliation Changed" },
  { value: "SUPERSEDED", label: "Superseded" },
  { value: "CESSATION_OF_OPERATION", label: "Cessation of Operation" },
  { value: "CERTIFICATE_HOLD", label: "Certificate Hold" },
  { value: "REMOVE_FROM_CRL", label: "Remove from CRL" },
  { value: "PRIVILEGE_WITHDRAWN", label: "Privilege Withdrawn" },
  { value: "AA_COMPROMISE", label: "AA Compromise" },
] as const

type RevocationReason = (typeof REVOCATION_REASONS)[number]["value"]

interface RevocationModalProps {
  cert: CertificateDto
  onClose: () => void
  onConfirm: (updatedCert: CertificateDto) => void
}

export function RevocationModal({
  cert,
  onClose,
  onConfirm,
}: RevocationModalProps) {
  const [reason, setReason] = useState<RevocationReason>("UNSPECIFIED")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await api.post("/api/v1/certificates/revoke", {
        certificateId: cert.id,
        revocationReason: reason,
      })
      onConfirm(response.data)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to revoke certificate. Access may be denied."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-none border border-sidebar-border bg-sidebar shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sidebar-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-destructive" />
            <span className="text-sm font-bold tracking-widest text-destructive uppercase">
              Revoke Certificate
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Certificate info */}
          <div className="border border-sidebar-border bg-sidebar-accent/10 p-4">
            <p className="text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase">
              Certificate
            </p>
            <p className="mt-1 font-bold text-sidebar-foreground">
              {cert.commonName}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              SN: {cert.serialNumber}
            </p>
          </div>

          {/* Warning */}
          <p className="text-xs text-muted-foreground">
            This action is{" "}
            <span className="font-bold text-destructive">irreversible</span>.
            The certificate will be added to the CRL immediately. Select the
            X.509 revocation reason:
          </p>

          {/* Reason selector */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase">
              Revocation Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RevocationReason)}
              className="w-full rounded-none border border-sidebar-border bg-sidebar px-3 py-2.5 text-sm text-sidebar-foreground focus:border-destructive focus:outline-none"
            >
              {REVOCATION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs font-semibold text-destructive">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-sidebar-border px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-none border-sidebar-border"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={submitting}
            onClick={handleConfirm}
            className="text-destructive-foreground rounded-none bg-destructive hover:bg-destructive/90"
          >
            {submitting ? "Revoking…" : "Confirm Revocation"}
          </Button>
        </div>
      </div>
    </div>
  )
}
