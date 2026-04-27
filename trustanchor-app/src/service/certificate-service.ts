import { createService } from "@/lib/base-service"
import type {
  CertificateDto,
  IssueCertificateRequest,
} from "@/types/certificate"

const svc = createService("/certificates")

export const getMyCertificates = () => svc.get<CertificateDto[]>()

export const getOrganizationCertificates = (orgId?: number) =>
  svc.get<CertificateDto[]>("/organization", {
    params: orgId !== undefined ? { orgId } : undefined,
  })

export const getAvailableIssuers = () => svc.get<CertificateDto[]>("/issuers")

export const issueCertificate = (dto: IssueCertificateRequest) =>
  svc.post<CertificateDto>("/issue", dto)
