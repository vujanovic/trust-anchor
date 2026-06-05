import { api } from "@/lib/axios"
import { createService } from "@/lib/base-service"
import type {
  CertificateDto,
  IssueCertificateRequest,
  GenerateCertificateRequest,
  CsrDashboardResponse,
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

export const autogenerateCertificate = (dto: GenerateCertificateRequest) => {
  return api.post("/api/v1/certificates/request/generate", dto, {
    responseType: "blob",
  })
}

export const uploadCsr = (dto: FormData) => {
  return api.post("/api/v1/certificates/request/upload", dto)
}

export const getRequests = () => {
  return service.get<CsrDashboardResponse[]>("/requests")
}

export const approveRequest = (id: number) =>
  api.post(
    `/api/v1/certificates/requests/${id}/approve`
  )

export const rejectRequest = (id: number) =>
  api.post(
    `/api/v1/certificates/requests/${id}/reject`
  )