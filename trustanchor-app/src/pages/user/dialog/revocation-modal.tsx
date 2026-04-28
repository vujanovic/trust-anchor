import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CertificateDto } from '@/types/certificate';

interface RevocationModalProps {
  cert: CertificateDto; // Updated to use DTO
  onClose: () => void;
  onConfirm: (reason: string, additionalInfo: string) => void;
}

export function RevocationModal({ cert, onClose, onConfirm }: RevocationModalProps) {
  // Common PKI revocation reasons usually follow uppercase enum patterns in DTOs
  const [reason, setReason] = useState('UNSPECIFIED');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason, additionalInfo);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-red-500/10 p-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <DialogTitle>Revoke Certificate</DialogTitle>
              <DialogDescription>This action cannot be undone</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Certificate Info Mapping */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs font-medium text-muted-foreground">Common Name</span>
              <span className="text-xs font-semibold text-foreground">{cert.commonName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-medium text-muted-foreground">Serial Number</span>
              <code className="text-xs font-mono text-foreground">
                {cert.serialNumber}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-medium text-muted-foreground">Organization</span>
              <span className="text-xs font-semibold text-foreground">{cert.organizationName}</span>
            </div>
          </div>

          {/* Revocation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Revocation Reason <span className="text-red-500">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNSPECIFIED">Unspecified</SelectItem>
                <SelectItem value="KEY_COMPROMISE">Key Compromise</SelectItem>
                <SelectItem value="CA_COMPROMISE">CA Compromise</SelectItem>
                <SelectItem value="AFFILIATION_CHANGED">Affiliation Changed</SelectItem>
                <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                <SelectItem value="CESSATION_OF_OPERATION">Cessation of Operation</SelectItem>
                <SelectItem value="CERTIFICATE_HOLD">Certificate Hold</SelectItem>
                {/* <SelectItem value="PRIVILEGE_WITHDRAWN">Privilege Withdrawn</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
            <Textarea
              id="additionalInfo"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={3}
              placeholder="Provide any additional context for this revocation..."
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">
              <strong>Warning:</strong> Revoking this certificate will immediately invalidate it. 
              Systems using this certificate will no longer trust it via CRL or OCSP check. 
              This action is permanent.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Revoke Certificate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}