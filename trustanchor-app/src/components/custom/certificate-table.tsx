import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CertificateDto } from "@/types/certificate"

interface CertificateTableProps {
  certs: CertificateDto[]
  onRevoke: (cert: CertificateDto) => void
  onDownload: (cert: CertificateDto) => void
}

export function CertificateTable({
  certs,
  onRevoke,
  onDownload,
}: CertificateTableProps) {
  if (certs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-base font-bold text-foreground">
          No certificates found
        </h3>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          You don't have any certificates yet. Request a new certificate to get
          started.
        </p>
      </div>
    )
  }

  // Updated to use status from CertificateDto
  const getStatusBadge = (status: CertificateDto["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle className="mr-1.5 h-3 w-3" />
            Active
          </Badge>
        )
      case "EXPIRED":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            <Clock className="mr-1.5 h-3 w-3" />
            Expired
          </Badge>
        )
      case "REVOKED":
        return (
          <Badge
            variant="outline"
            className="border-red-500/20 bg-red-500/10 text-red-500"
          >
            <XCircle className="mr-1.5 h-3 w-3" />
            Revoked
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Common Name</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Valid From</TableHead>
            <TableHead>Valid To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certs.map((cert) => (
            <TableRow key={cert.id}>
              <TableCell>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {cert.commonName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {cert.organizationName}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                  {cert.serialNumber}
                </code>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(cert.notBefore).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(cert.notAfter).toLocaleDateString()}
              </TableCell>
              <TableCell>{getStatusBadge(cert.status)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {cert.status === "ACTIVE" && (
                    <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1"
                    onClick={() => onDownload(cert)}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download
                  </Button>
                  )}
                  {cert.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                      onClick={() => onRevoke(cert)}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
