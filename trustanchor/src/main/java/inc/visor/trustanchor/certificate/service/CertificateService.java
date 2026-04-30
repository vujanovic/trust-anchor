package inc.visor.trustanchor.certificate.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.enums.CertificateStatus;
import inc.visor.trustanchor.certificate.enums.CertificateType;
import inc.visor.trustanchor.certificate.repository.CertificateRepository;
import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.user.entity.UserRole;

@Service
@Transactional(readOnly = true)
public class CertificateService {

    private final CertificateRepository certificateRepository;

    public CertificateService(CertificateRepository certificateRepository) {
        this.certificateRepository = certificateRepository;
    }

    public List<Certificate> getCertificates() {
        return certificateRepository.findAll();
    }

    public List<Certificate> getUserCertificates(Long userId) {
        return certificateRepository.findByUserId(userId);
    }

    public Certificate getCertificate(Long id) {
        return certificateRepository.findById(id).orElse(null);
    }

    public Certificate saveCertificate(Certificate certificate) {
        return certificateRepository.save(certificate);
    }

    public List<Certificate> getOrganizationCertificates(Long organizationId) {
        return certificateRepository.findByOrganizationId(organizationId);
    }

    public List<Certificate> getAvailableIssuers(Long organizationId, UserRole userRole) {
        List<CertificateType> caTypes = List.of(CertificateType.ROOT, CertificateType.INTERMEDIATE);
        List<Certificate> candidates = switch (userRole) {
            case ADMIN   -> certificateRepository.findByCertificateTypeInAndStatus(caTypes, CertificateStatus.ACTIVE);
            case CA_USER -> certificateRepository.findByOrganizationIdAndCertificateTypeInAndStatus(organizationId, caTypes, CertificateStatus.ACTIVE);
            default      -> List.of();
        };
        return candidates.stream()
                .filter(c -> !java.time.LocalDateTime.now().isAfter(c.getNotAfter()))
                .toList();
    }

    public Certificate getCertificateForOrganization(Long certificateId, Long organizationId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new NotFoundException("Certificate not found"));
        if (!certificate.getOrganizationId().equals(organizationId)) {
            throw new NotFoundException("Certificate not found");
        }
        return certificate;
    }
}