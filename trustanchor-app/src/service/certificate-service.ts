import { api } from "@/lib/axios"
import { createService } from "@/lib/base-service"
import type {
  CertificateDto,
  IssueCertificateRequest,
} from "@/types/certificate"

const service = createService("/certificates")

export const getMyCertificates = () => service.get<CertificateDto[]>("/me")

export const getOrganizationCertificates = (orgId?: number) =>
  service.get<CertificateDto[]>("/organization", {
    params: orgId !== undefined ? { orgId } : undefined,
  })

export const getAvailableIssuers = () =>
  service.get<CertificateDto[]>("/issuers")

export const issueCertificate = (dto: IssueCertificateRequest) =>
  service.post<CertificateDto>("/issue", dto)

export const downloadPkcs12 = (id: number, password: string) =>
  api.post(
    `/api/v1/certificates/${id}/download/pkcs12`,
    { password },
    { responseType: "blob" }
  )

export const downloadPem = (id: number) => 
  api.post(
    `/api/v1/certificates/${id}/download/pem`,
    {},
    { responseType: "blob" }
  )


export const downloadCer = (id: number) => 
  api.post(
    `/api/v1/certificates/${id}/download/cer`,
    {},
    { responseType: "blob" }
  )
