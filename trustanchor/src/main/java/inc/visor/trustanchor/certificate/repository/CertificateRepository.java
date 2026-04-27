package inc.visor.trustanchor.certificate.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.enums.CertificateStatus;
import inc.visor.trustanchor.certificate.enums.CertificateType;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    List<Certificate> findByUserId(Long userId);

    List<Certificate> findByOrganizationId(Long organizationId);
    List<Certificate> findByOrganizationIdAndStatusNot(Long organizationId, CertificateStatus status);
    // Active CA certs the CA user can sign with (their org only):
    List<Certificate> findByOrganizationIdAndCertificateTypeInAndStatus(
        Long orgId, List<CertificateType> types, CertificateStatus status);
    // Admin can use any active CA cert:
    List<Certificate> findByCertificateTypeInAndStatus(List<CertificateType> types, CertificateStatus status);

}