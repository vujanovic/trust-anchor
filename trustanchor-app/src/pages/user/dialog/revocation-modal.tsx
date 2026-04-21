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

interface RevocationModalProps {
  cert: Certificate;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function RevocationModal({ cert, onClose, onConfirm }: RevocationModalProps) {
  const [reason, setReason] = useState('unspecified');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
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
          {/* Certificate Info */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs font-medium text-muted-foreground">Common Name</span>
              <span className="text-xs font-semibold text-foreground">{cert.cn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-medium text-muted-foreground">Serial Number</span>
              <code className="text-xs font-mono text-foreground">
                {cert.serialNumber}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-medium text-muted-foreground">Issuer</span>
              <span className="text-xs font-semibold text-foreground">{cert.issuer}</span>
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
                <SelectItem value="unspecified">Unspecified</SelectItem>
                <SelectItem value="keyCompromise">Key Compromise</SelectItem>
                <SelectItem value="caCompromise">CA Compromise</SelectItem>
                <SelectItem value="affiliationChanged">Affiliation Changed</SelectItem>
                <SelectItem value="superseded">Superseded</SelectItem>
                <SelectItem value="cessationOfOperation">Cessation of Operation</SelectItem>
                <SelectItem value="certificateHold">Certificate Hold</SelectItem>
                <SelectItem value="privilegeWithdrawn">Privilege Withdrawn</SelectItem>
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
              Any systems or applications using this certificate will no longer trust it. 
              This action is permanent and cannot be reversed.
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