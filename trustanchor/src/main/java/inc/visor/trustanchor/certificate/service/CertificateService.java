package inc.visor.trustanchor.certificate.service;

import java.io.ByteArrayInputStream;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.ArrayList;
import java.util.List;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.enums.CertificateStatus;
import inc.visor.trustanchor.certificate.enums.CertificateType;
import inc.visor.trustanchor.certificate.repository.CertificateRepository;
import inc.visor.trustanchor.encryption.dto.EncryptedData;
import inc.visor.trustanchor.encryption.service.EncryptionService;
import inc.visor.trustanchor.encryption.service.OrganizationKeyService;
import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.exception.UnauthorizedAccessException;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;
import inc.visor.trustanchor.user.entity.UserRole;

@Service
@Transactional(readOnly = true)
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final EncryptionService encryptionService;
    private final OrganizationKeyService orgKeyService;

    public CertificateService(CertificateRepository certificateRepository, EncryptionService encryptionService, OrganizationKeyService orgKeyService) {
        this.certificateRepository = certificateRepository;
        this.encryptionService = encryptionService;
        this.orgKeyService = orgKeyService;
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

    @Transactional
    public Certificate saveCertificate(Certificate certificate) {
        return certificateRepository.save(certificate);
    }

    public Certificate findById(Long id) {
        return certificateRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Certificate not found"));
    }

    public List<Certificate> getOrganizationCertificates(Long organizationId) {
        return certificateRepository.findByOrganizationId(organizationId);
    }

    public Void save(Certificate cert) {
        certificateRepository.save(cert);
        return null;
    }

    public List<Certificate> getAvailableIssuers(Long organizationId, UserRole userRole) {
        List<CertificateType> caTypes = List.of(CertificateType.ROOT, CertificateType.INTERMEDIATE);
        List<Certificate> candidates = switch (userRole) {
            case ADMIN   -> certificateRepository.findByCertificateTypeInAndStatus(caTypes, CertificateStatus.ACTIVE);
            case CA_USER -> certificateRepository.findByOrganizationIdAndCertificateTypeInAndStatus(organizationId, caTypes, CertificateStatus.ACTIVE);
            default      -> certificateRepository.findByOrganizationIdAndCertificateTypeInAndStatus(organizationId, caTypes, CertificateStatus.ACTIVE);
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

    @Transactional(readOnly = true)
    public List<X509Certificate> buildCertificateChain(Certificate certificate) throws Exception {
        List<X509Certificate> chain = new ArrayList<>();
        Certificate current = certificate;
        while (current != null) {
            X509Certificate x509 = (X509Certificate) CertificateFactory.getInstance("X509").generateCertificate(new ByteArrayInputStream(current.getCertificateContent()));
            chain.add(x509);

            Long issuerId = current.getIssuerCertificate() != null ? current.getIssuerCertificate().getId() : null;
            if (issuerId == null || issuerId.equals(current.getId())) {
                break; // Reached self-signed or no issuer
            }
            current = certificateRepository.findById(issuerId).orElse(null);
        }
        return chain;
    }

    public PrivateKey decryptCertificatePrivateKey(Certificate cert) throws Exception {
        EncryptedData enc = EncryptedData.unpack(cert.getPrivateKeyEncrypted());
        SecretKey orgKey = orgKeyService.getOrCreateOrgKey(cert.getOrganizationId());
        byte[] keyBytes = encryptionService.decrypt(enc, orgKey);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
    }

    public Certificate authorizeAndFetch(Long certId, AnchorUserDetails currentUser) {
        Certificate cert = certificateRepository.findById(certId)
            .orElseThrow(() -> new NotFoundException("Certificate not found"));
        UserRole role = currentUser.getUser().getUserRole();
        boolean allowed = switch (role) {
            case ADMIN -> true;
            case CA_USER -> cert.getOrganizationId().equals(
                currentUser.getUser().getOrganization().getId());
            case USER -> cert.getUserId() != null &&
                cert.getUserId().equals(currentUser.getId());
        };
        if (!allowed) throw new UnauthorizedAccessException("Access denied");
        return cert;
    }
}