import { CheckCircle, XCircle, Clock, Download, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Certificate {
  id: string;
  cn: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  status: 'active' | 'expired' | 'revoked';
  issuer: string;
  keyAlg: string;
}

interface CertificateTableProps {
  certs: Certificate[];
  onRevoke: (cert: Certificate) => void;
}

export function CertificateTable({ certs, onRevoke }: CertificateTableProps) {
  if (certs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-2">No certificates found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          You don't have any certificates yet. Request a new certificate to get started.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: Certificate['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1.5" />
            Active
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            <Clock className="w-3 h-3 mr-1.5" />
            Expired
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1.5" />
            Revoked
          </Badge>
        );
    }
  };

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
                  <p className="text-sm font-semibold text-foreground">{cert.cn}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cert.issuer}</p>
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded">
                  {cert.serialNumber}
                </code>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {cert.validFrom}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {cert.validTo}
              </TableCell>
              <TableCell>
                {getStatusBadge(cert.status)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-auto py-1 px-2">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </Button>
                  {cert.status === 'active' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto py-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => onRevoke(cert)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
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
  );
}