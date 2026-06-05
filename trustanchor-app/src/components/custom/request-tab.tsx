import React, { useEffect, useState } from "react"
import { Upload, FileText, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getAvailableIssuers } from "@/service/certificate-service"
import type { CertificateDto } from "@/types/certificate"

interface CA {
  id: string
  name: string
  type: string
  usage: string
}

interface RequestTabProps {
  cas: CA[]
  email: string
  organizationName: string
}

export function RequestTab({ email, organizationName }: RequestTabProps) {
  const [selectedCA, setSelectedCA] = useState<string>("")
  const [csrMethod, setCsrMethod] = useState<"generate" | "upload">("generate")

  // Added validFrom and validTo directly into the main form data state
  const [formData, setFormData] = useState({
    issuerId: null as number | null,
    csrMethod: csrMethod,
    commonName: "",
    email: email,
    organization: organizationName,
    organizationalUnit: "",
    country: "",
    csrFile: null as File | null,
    validFrom: "",
    validTo: "",
  })

  const [issuers, setIssuers] = useState<CertificateDto[]>([])
  const [issuersLoaded, setIssuersLoaded] = useState(false)

  // Find the full DTO object of the currently selected CA to read its valid date bounds
  const currentIssuer = issuers.find((iss) => String(iss.id) === selectedCA)

  // Helper utility to convert ISO strings (e.g. 2026-06-04T12:00:00Z) to HTML date input format (YYYY-MM-DD)
  const formatDateForInput = (isoString?: string) => {
    if (!isoString) return ""
    return isoString.split("T")[0]
  }

  const minAllowedDate = formatDateForInput(currentIssuer?.notBefore)
  const maxAllowedDate = formatDateForInput(currentIssuer?.notAfter)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Enforce range checks on submission as an extra layer of protection
    if (minAllowedDate && formData.validFrom < minAllowedDate) {
      alert(
        `Error: The start date cannot be earlier than the CA's issue date (${minAllowedDate}).`
      )
      return
    }
    if (maxAllowedDate && formData.validTo > maxAllowedDate) {
      alert(
        `Error: The expiration date cannot exceed the CA's expiration date (${maxAllowedDate}).`
      )
      return
    }

    console.log("Certificate request:", {
    csrMethod,
    formData,
})
    alert("Certificate request submitted! (This is a demo)")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, csrFile: file }))
  }

  const loadIssuers = () => {
    getAvailableIssuers()
      .then((data) => {
        setIssuers(data)
        setIssuersLoaded(true)
        console.log(data)
        if (data && data.length > 0) {
          setSelectedCA(String(data[0].id))

          // Pre-populate input defaults using the first chosen CA boundaries
          setFormData((prev) => ({
            ...prev,
            issuerId: data[0].id,
            validFrom: data[0].notBefore.split("T")[0],
            validTo: data[0].notAfter.split("T")[0],
          }))
        }
      })
      .catch(() => {
        setIssuersLoaded(true)
      })
  }

  useEffect(() => {
    if (issuersLoaded) return
    loadIssuers()
  }, [issuersLoaded])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-bold text-foreground">
          Request New Certificate
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Submit a Certificate Signing Request (CSR) to one of the available
          Certificate Authorities.
        </p>
      </div>

      {/* CA Selection */}
      <div className="space-y-2">
        <Label htmlFor="ca-selection">Select Certificate Authority</Label>
        <Select
          value={selectedCA}
          onValueChange={(value) => {
              setSelectedCA(value)

              const newIssuer = issuers.find((iss) => String(iss.id) === value)
              if (newIssuer) {
                const issuerMin = newIssuer.notBefore.split("T")[0]
                const issuerMax = newIssuer.notAfter.split("T")[0]

                setFormData((prev) => ({
                  ...prev,
                  issuerId: newIssuer.id,
                  validFrom:
                    prev.validFrom < issuerMin || prev.validFrom > issuerMax
                      ? issuerMin
                      : prev.validFrom,
                  validTo:
                    prev.validTo > issuerMax || prev.validTo < issuerMin
                      ? issuerMax
                      : prev.validTo,
                }))
              }
          }}
          >
          <SelectTrigger id="ca-selection">
            <SelectValue placeholder="Select an issuer..." />
          </SelectTrigger>
          <SelectContent>
            {issuers.map((ca) => (
              <SelectItem key={ca.id} value={String(ca.id)}>
                {ca.commonName} — {ca.certificateType}
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
            variant={csrMethod === "generate" ? "default" : "outline"}
            onClick={() => setCsrMethod("generate")}
            className="w-full"
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate CSR
          </Button>
          <Button
            type="button"
            variant={csrMethod === "upload" ? "default" : "outline"}
            onClick={() => setCsrMethod("upload")}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload CSR
          </Button>
        </div>
      </div>

      {/* Shared Validity Range Configuration Area */}
      <div className="my-2 space-y-4 rounded-lg border-y border-border bg-muted/20 p-4 py-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            Certificate Lifespan Range
          </h4>
          {currentIssuer && (
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              Max Bounds: {minAllowedDate} to {maxAllowedDate}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="validFrom">Not Before *</Label>
            <Input
              id="validFrom"
              type="date"
              required
              min={minAllowedDate}
              max={maxAllowedDate}
              value={formData.validFrom}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, validFrom: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validTo">Not After *</Label>
            <Input
              id="validTo"
              type="date"
              required
              min={formData.validFrom || minAllowedDate} // Ensure expiration cannot happen before issue start point
              max={maxAllowedDate}
              value={formData.validTo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, validTo: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {csrMethod === "generate" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="commonName">
                Common Name (CN) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="commonName"
                type="text"
                required
                value={formData.commonName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    commonName: e.target.value,
                  }))
                }
                placeholder="john.doe@corp.local"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john.doe@example.com"
                disabled={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization (O)</Label>
              <Input
                id="organization"
                type="text"
                value={formData.organization}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    organization: e.target.value,
                  }))
                }
                placeholder="Example Corp"
                disabled={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationalUnit">
                Organizational Unit (OU)
              </Label>
              <Input
                id="organizationalUnit"
                type="text"
                value={formData.organizationalUnit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    organizationalUnit: e.target.value,
                  }))
                }
                placeholder="IT Department"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="country">Country (C)</Label>
              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, country: e.target.value }))
                }
                placeholder="RS"
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              You can download private key only once for autogenerated certificates. 
              Make sure to download and securely store it after the
              certificate is issued.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Upload CSR File</Label>
          <div className="flex w-full items-center justify-center">
            <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PEM or DER format (.csr, .pem)
                </p>
                {formData.csrFile && (
                  <p className="mt-2 text-xs font-medium text-primary">
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

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">
          <FileText className="mr-2 h-4 w-4" />
          Submit Request
        </Button>
      </div>
    </form>
  )
}
