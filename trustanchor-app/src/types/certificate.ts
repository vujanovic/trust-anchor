export type CertificateType = "ROOT" | "INTERMEDIATE" | "END_ENTITY"

export type CertificateStatus = "ACTIVE" | "REVOKED" | "EXPIRED"

export type RevocationReason =
  | "UNSPECIFIED"
  | "KEY_COMPROMISE"
  | "CA_COMPROMISE"
  | "AFFILIATION_CHANGED"
  | "SUPERSEDED"
  | "CESSATION_OF_OPERATION"
  | "CERTIFICATE_HOLD"

export interface CertificateDto {
  id: number
  serialNumber: string
  commonName: string
  organizationName: string
  organizationalUnit?: string
  country: string
  email?: string
  certificateType: CertificateType
  notBefore: string
  notAfter: string
  status: CertificateStatus
  revokedAt?: string
  revocationReason?: RevocationReason
  createdAt: string
  isValid: boolean
  isCACertificate: boolean
  privateKeyDownloaded: boolean
  hasPrivateKey: boolean
}

export interface ExtensionsRequest {
  isCA: boolean
  keyCertSign: boolean
  crlSign: boolean
  digitalSignature: boolean
  keyEncipherment: boolean
  dataEncipherment: boolean
  nonRepudiation: boolean
  extendedKeyUsages: string[]
}

export interface IssueCertificateRequest {
  issuerCertificateId: number
  certificateType: CertificateType
  commonName: string
  organizationName: string
  organizationalUnit?: string
  country: string
  email?: string
  notBefore: string // ISO string
  notAfter: string
  extensions: ExtensionsRequest
}
