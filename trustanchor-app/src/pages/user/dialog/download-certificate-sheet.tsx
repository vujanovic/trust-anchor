import { useState } from "react"
import {
  KeyRound,
  AlertTriangle,
  Loader2,
  ShieldOff,
  FileDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { downloadPkcs12 } from "@/service/certificate-service"
import { triggerBlobDownload } from "@/lib/download-utils"
import type { CertificateDto } from "@/types/certificate"

interface DownloadCertificateSheetProps {
  cert: CertificateDto | null
  open: boolean
  onClose: () => void
  onDownloaded: (certId: number) => void
}

export function DownloadCertificateSheet({
  cert,
  open,
  onClose,
  onDownloaded,
}: DownloadCertificateSheetProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setPassword("")
    setConfirmPassword("")
    setError(null)
    setLoading(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
      onClose()
    }
  }

  const handleDownloadPkcs12 = async () => {
    if (!cert) return

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setError(null)
    setLoading(true)
    try {
      const response = await downloadPkcs12(cert.id, password)
      triggerBlobDownload(response.data as Blob, `${cert.commonName}.p12`)
      onDownloaded(cert.id)
      reset()
      onClose()
    } catch {
      setError("Download failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!cert) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <FileDown className="h-4 w-4 text-primary" />
            Download Certificate
          </SheetTitle>
          <SheetDescription className="truncate font-mono text-xs">
            {cert.commonName} · {cert.serialNumber}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {/* With Private Key section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                With Private Key (.p12)
              </span>
            </div>

            {cert.hasPrivateKey ? (
              <>
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    You can only download the private key <strong>once</strong>.
                    Store the .p12 file and its password in a safe place.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pkcs12-password" className="text-xs">
                    PKCS12 Password
                  </Label>
                  <Input
                    id="pkcs12-password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pkcs12-confirm" className="text-xs">
                    Confirm Password
                  </Label>
                  <Input
                    id="pkcs12-confirm"
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleDownloadPkcs12()
                    }
                    autoComplete="new-password"
                  />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <Button
                  onClick={handleDownloadPkcs12}
                  disabled={loading}
                  size="sm"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-3.5 w-3.5" />
                      Download .p12
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="flex items-start gap-2 rounded-md border border-muted bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                <ShieldOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {cert.privateKeyDownloaded
                    ? "The private key for this certificate has already been downloaded and is no longer available."
                    : "No private key is stored for this certificate (CSR-based issuance)."}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Certificate only section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Certificate Only</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Download without the private key. Supported by another team member
              — coming soon.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="flex-1">
                Download .pem
              </Button>
              <Button variant="outline" size="sm" disabled className="flex-1">
                Download .cer
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
