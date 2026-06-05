import React, { useEffect, useState } from "react"
import { Upload, FileText, Info, CheckCircle } from "lucide-react"
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
import { autogenerateCertificate, uploadCsr } from "@/service/certificate-service"
import { triggerBlobDownload } from "@/lib/download-utils"

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

const AVAILABLE_EKUS = [
  { id: "serverAuth", label: "Server Authentication" },
  { id: "clientAuth", label: "Client Authentication" },
  { id: "emailProtection", label: "Email Protection" },
  { id: "codeSigning", label: "Code Signing" },
]

export function RequestTab({ email, organizationName }: RequestTabProps) {
  const [selectedCA, setSelectedCA] = useState<string>("")
  const [csrMethod, setCsrMethod] = useState<"generate" | "upload">("generate")

  const todayStr = new Date().toISOString().split("T")[0]

  // Form state structure now maps directly to GenerateCertificateRequest
  const [formData, setFormData] = useState({
    issuerId: null as number | null,
    csrMethod: csrMethod,
    commonName: "",
    email: email,
    organization: organizationName,
    organizationalUnit: "",
    country: "",
    password: "",
    csrFile: null as File | null,
    validFrom: "",
    validTo: "",
    extensions: {
      isCA: false,
      keyCertSign: false,
      crlSign: false,
      digitalSignature: true,
      keyEncipherment: true,
      dataEncipherment: false,
      nonRepudiation: false,
      extendedKeyUsages: [] as string[],
    },
  })

  const [issuers, setIssuers] = useState<CertificateDto[]>([])
  const [issuersLoaded, setIssuersLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const currentIssuer = issuers.find((iss) => String(iss.id) === selectedCA)

  const formatDateForInput = (isoString?: string) => {
    if (!isoString) return ""
    return isoString.split("T")[0]
  }

  const caNotBefore = formatDateForInput(currentIssuer?.notBefore)
  const maxAllowedDate = formatDateForInput(currentIssuer?.notAfter)
  const minAllowedDate =
    caNotBefore && caNotBefore > todayStr ? caNotBefore : todayStr

  const resetForm = (targetIssuer?: CertificateDto) => {
    const activeIssuer = targetIssuer || currentIssuer
    setFormData({
      issuerId: activeIssuer ? activeIssuer.id : null,
      csrMethod: csrMethod,
      commonName: "",
      email: email,
      organization: organizationName,
      organizationalUnit: "",
      country: "",
      password: "",
      csrFile: null,
      validFrom: activeIssuer
        ? formatDateForInput(activeIssuer.notBefore) > todayStr
          ? formatDateForInput(activeIssuer.notBefore)
          : todayStr
        : todayStr,
      validTo: activeIssuer ? formatDateForInput(activeIssuer.notAfter) : "",
      extensions: {
        isCA: false,
        keyCertSign: false,
        crlSign: false,
        digitalSignature: true,
        keyEncipherment: true,
        dataEncipherment: false,
        nonRepudiation: false,
        extendedKeyUsages: [],
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Enforce real-time date bounds matching current time constraints
    if (formData.validFrom < minAllowedDate) {
      setError(
        `Error: The start date cannot be earlier than today or the CA's issue date (${minAllowedDate}).`
      )
      return
    }
    if (maxAllowedDate && formData.validTo > maxAllowedDate) {
      setError(
        `Error: The expiration date cannot exceed the CA's expiration date (${maxAllowedDate}).`
      )
      return
    }

    if (csrMethod === "generate") {
      try {
        const response = await autogenerateCertificate(formData)

        triggerBlobDownload(
          response.data as Blob,
          `${formData.commonName || "certificate"}.p12`
        )

        // Populate success message banner and clear down form fields
        setSuccessMessage(
          "Success! Your certificate request has been processed and your secure PKCS12 file (.p12) has been downloaded."
        )
        resetForm()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.response && err.response.data instanceof Blob) {
          try {
            const blobText = await err.response.data.text()
            const parsedError = JSON.parse(blobText)
            setError(
              parsedError.message || "Generation failed. Please try again."
            )
          } catch {
            setError("Generation failed. Invalid server response.")
          }
        } else {
          setError(
            "Generation failed. Please check your network and try again."
          )
        }
      }
    } else if (csrMethod == "upload") {
      const submitData = new FormData()

      if (!formData.csrFile) {
        setError("Please select a valid CSR file to upload.")
        return
      }

      if (!formData.issuerId) {
        setError("Select CA for signing.")
        return
      }

      submitData.append("csrFile", formData.csrFile)
      submitData.append("validFrom", formData.validFrom)
      submitData.append("validTo", formData.validTo)
      submitData.append("issuerId", String(formData.issuerId))

      try {
        const response = await uploadCsr(submitData)
        console.log("Uploaded successfully", response.data);
        resetForm()
        setSuccessMessage("Successfully requested. Certificate will become available for download after it's been approved.")
      } catch (err) {
        console.error("Upload error", err);
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, csrFile: file }))
  }

  const handleExtensionCheckboxChange = (key: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      extensions: {
        ...prev.extensions,
        [key]: checked,
      },
    }))
  }

  const handleEkuChange = (ekuId: string, checked: boolean) => {
    setFormData((prev) => {
      const currentEkus = [...prev.extensions.extendedKeyUsages]
      if (checked) {
        if (!currentEkus.includes(ekuId)) currentEkus.push(ekuId)
      } else {
        const index = currentEkus.indexOf(ekuId)
        if (index > -1) currentEkus.splice(index, 1)
      }
      return {
        ...prev,
        extensions: {
          ...prev.extensions,
          extendedKeyUsages: currentEkus,
        },
      }
    })
  }

  const loadIssuers = () => {
    getAvailableIssuers()
      .then((data) => {
        setIssuers(data)
        setIssuersLoaded(true)
        if (data && data.length > 0) {
          setSelectedCA(String(data[0].id))
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
            onClick={() => {
              setCsrMethod("generate")
              setFormData((prev) => ({ ...prev, csrMethod: "generate" }))
            }}
            className="w-full"
          >
            <FileText className="mr-2 h-4 w-4" /> Generate CSR
          </Button>
          <Button
            type="button"
            variant={csrMethod === "upload" ? "default" : "outline"}
            onClick={() => {
              setCsrMethod("upload")
              setFormData((prev) => ({ ...prev, csrMethod: "upload" }))
            }}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" /> Upload CSR
          </Button>
        </div>
      </div>

      {/* Shared Validity Range */}
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
              min={formData.validFrom || minAllowedDate}
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
        <div className="space-y-6">
          {/* Certificate Subject Info Block */}
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
                  disabled
                  placeholder="john.doe@example.com"
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
                  disabled
                  placeholder="Example Corp"
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">Country (C)</Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  placeholder="RS"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  PKCS12 Bundle Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  autoComplete="new-password"
                  placeholder="Secure password for .p12"
                />
              </div>
            </div>
          </div>

          {/* Certificate Extensions Section using native HTML checkboxes */}
          <div className="space-y-4 rounded-lg border border-border bg-muted/10 p-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                X.509 Certificate Extensions
              </h4>
              <p className="text-xs text-muted-foreground">
                Configure structural constraints and basic usages.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="digitalSignature"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.extensions.digitalSignature}
                  onChange={(e) =>
                    handleExtensionCheckboxChange(
                      "digitalSignature",
                      e.target.checked
                    )
                  }
                />
                <Label
                  htmlFor="digitalSignature"
                  className="cursor-pointer text-xs font-normal select-none"
                >
                  Digital Signature
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="keyEncipherment"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.extensions.keyEncipherment}
                  onChange={(e) =>
                    handleExtensionCheckboxChange(
                      "keyEncipherment",
                      e.target.checked
                    )
                  }
                />
                <Label
                  htmlFor="keyEncipherment"
                  className="cursor-pointer text-xs font-normal select-none"
                >
                  Key Encipherment
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dataEncipherment"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.extensions.dataEncipherment}
                  onChange={(e) =>
                    handleExtensionCheckboxChange(
                      "dataEncipherment",
                      e.target.checked
                    )
                  }
                />
                <Label
                  htmlFor="dataEncipherment"
                  className="cursor-pointer text-xs font-normal select-none"
                >
                  Data Encipherment
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="nonRepudiation"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.extensions.nonRepudiation}
                  onChange={(e) =>
                    handleExtensionCheckboxChange(
                      "nonRepudiation",
                      e.target.checked
                    )
                  }
                />
                <Label
                  htmlFor="nonRepudiation"
                  className="cursor-pointer text-xs font-normal select-none"
                >
                  Non Repudiation
                </Label>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <Label className="text-xs font-semibold text-foreground">
                Extended Key Usages (EKU)
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {AVAILABLE_EKUS.map((eku) => (
                  <div key={eku.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`eku-${eku.id}`}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.extensions.extendedKeyUsages.includes(
                        eku.id
                      )}
                      onChange={(e) =>
                        handleEkuChange(eku.id, e.target.checked)
                      }
                    />
                    <Label
                      htmlFor={`eku-${eku.id}`}
                      className="cursor-pointer text-xs font-normal select-none"
                    >
                      {eku.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              You can download the private key only once for autogenerated
              certificates. Make sure to download and securely store it along
              with your chosen password after the certificate is issued.
            </p>
          </div>
        </div>
      ) : (
        /* Upload CSR Section */
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

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">
          <FileText className="mr-2 h-4 w-4" /> Submit Request
        </Button>
      </div>

      {error && (
        <div
          style={{
            color: "red",
            backgroundColor: "#ffebee",
            padding: "10px",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {successMessage}
          </div>
        </div>
      )}
    </form>
  )
}
