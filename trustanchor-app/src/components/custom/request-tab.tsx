import React, { useState } from 'react';
import { Upload, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CA {
  id: string;
  name: string;
  type: string;
  usage: string;
}

interface RequestTabProps {
  cas: CA[];
}

export function RequestTab({ cas }: RequestTabProps) {
  const [selectedCA, setSelectedCA] = useState(cas[0]?.id || '');
  const [csrMethod, setCsrMethod] = useState<'generate' | 'upload'>('generate');
  const [formData, setFormData] = useState({
    commonName: '',
    email: '',
    organization: '',
    organizationalUnit: '',
    locality: '',
    state: '',
    country: '',
    keyAlgorithm: 'RSA-2048',
    csrFile: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Certificate request:', { selectedCA, csrMethod, formData });
    alert('Certificate request submitted! (This is a demo)');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, csrFile: file }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Request New Certificate
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Submit a Certificate Signing Request (CSR) to one of the available Certificate Authorities.
        </p>
      </div>

      {/* CA Selection */}
      <div className="space-y-2">
        <Label>Select Certificate Authority</Label>
        <Select value={selectedCA} onValueChange={setSelectedCA}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cas.map(ca => (
              <SelectItem key={ca.id} value={ca.id}>
                {ca.name} — {ca.usage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* CSR Method */}
      <div className="space-y-2">
        <Label>CSR Method</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={csrMethod === 'generate' ? 'default' : 'outline'}
            onClick={() => setCsrMethod('generate')}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate CSR
          </Button>
          <Button
            type="button"
            variant={csrMethod === 'upload' ? 'default' : 'outline'}
            onClick={() => setCsrMethod('upload')}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSR
          </Button>
        </div>
      </div>

      {csrMethod === 'generate' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commonName">
                Common Name (CN) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="commonName"
                type="text"
                required
                value={formData.commonName}
                onChange={(e) => setFormData(prev => ({ ...prev, commonName: e.target.value }))}
                placeholder="john.doe@corp.local"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization (O)</Label>
              <Input
                id="organization"
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Example Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationalUnit">Organizational Unit (OU)</Label>
              <Input
                id="organizationalUnit"
                type="text"
                value={formData.organizationalUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, organizationalUnit: e.target.value }))}
                placeholder="IT Department"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locality">Locality (L)</Label>
              <Input
                id="locality"
                type="text"
                value={formData.locality}
                onChange={(e) => setFormData(prev => ({ ...prev, locality: e.target.value }))}
                placeholder="Belgrade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province (ST)</Label>
              <Input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Central Serbia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country (C)</Label>
              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="RS"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyAlgorithm">Key Algorithm</Label>
            <Select 
              value={formData.keyAlgorithm} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, keyAlgorithm: value }))}
            >
              <SelectTrigger id="keyAlgorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RSA-2048">RSA-2048</SelectItem>
                <SelectItem value="RSA-4096">RSA-4096</SelectItem>
                <SelectItem value="EC-P256">EC-P256</SelectItem>
                <SelectItem value="EC-P384">EC-P384</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              The private key will be generated in your browser and never transmitted. Make sure to download and securely store it after the certificate is issued.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Upload CSR File</Label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors border-border">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PEM or DER format (.csr, .pem)</p>
                {formData.csrFile && (
                  <p className="mt-2 text-xs text-primary font-medium">
                    Selected: {formData.csrFile.name}
                  </p>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csr,.pem"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">
          <FileText className="w-4 h-4 mr-2" />
          Submit Request
        </Button>
      </div>
    </form>
  );
}