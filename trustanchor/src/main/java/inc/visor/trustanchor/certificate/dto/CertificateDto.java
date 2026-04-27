package inc.visor.trustanchor.certificate.dto;

import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.enums.CertificateStatus;
import inc.visor.trustanchor.certificate.enums.CertificateType;
import inc.visor.trustanchor.certificate.enums.RevocationReason;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateDto {
    private Long id;
    private String serialNumber;
    private String commonName;
    private String organizationName;
    private String organizationalUnit;
    private String country;
    private String email;
    private CertificateType certificateType;
    private LocalDateTime notBefore;
    private LocalDateTime notAfter;
    private CertificateStatus status;
    private LocalDateTime revokedAt;
    private RevocationReason revocationReason;
    private String crlDistributionPoint;
    private LocalDateTime createdAt;
    private Boolean isValid;
    private Boolean isCACertificate;
    private Boolean privateKeyDownloaded;

    public CertificateDto(Certificate certificate) {
        this.id = certificate.getId();
        this.serialNumber = certificate.getSerialNumber();
        this.commonName = certificate.getCommonName();
        this.organizationName = certificate.getOrganizationName();
        this.organizationalUnit = certificate.getOrganizationalUnit();
        this.country = certificate.getCountry();
        this.email = certificate.getEmail();
        this.certificateType = certificate.getCertificateType();
        this.notBefore = certificate.getNotBefore();
        this.notAfter = certificate.getNotAfter();
        this.status = certificate.getStatus();
        this.revokedAt = certificate.getRevokedAt();
        this.revocationReason = certificate.getRevocationReason();
        this.crlDistributionPoint = certificate.getCrlDistributionPoint();
        this.createdAt = certificate.getCreatedAt();
        this.isValid = certificate.isValid();
        this.isCACertificate = certificate.isCACertificate();
        this.privateKeyDownloaded = certificate.getPrivateKeyDownloaded();
    }
}