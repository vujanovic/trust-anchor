import { createService } from "@/lib/base-service"
import type {
  CertificateDto,
  IssueCertificateRequest,
} from "@/types/certificate"

const service = createService("/certificates")

export const getMyCertificates = () => service.get<CertificateDto[]>()

export const getOrganizationCertificates = (orgId?: number) =>
  service.get<CertificateDto[]>("/organization", {
    params: orgId !== undefined ? { orgId } : undefined,
  })

export const getAvailableIssuers = () =>
  service.get<CertificateDto[]>("/issuers")
export const issueCertificate = (dto: IssueCertificateRequest) =>
  service.post<CertificateDto>("/issue", dto)
