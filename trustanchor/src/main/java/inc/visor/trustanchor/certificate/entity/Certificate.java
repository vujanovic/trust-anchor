package inc.visor.trustanchor.certificate.entity;

import inc.visor.trustanchor.certificate.enums.CertificateStatus;
import inc.visor.trustanchor.certificate.enums.CertificateType;
import inc.visor.trustanchor.certificate.enums.RevocationReason;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Data
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "serial_number", nullable = false, unique = true)
    private String serialNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issuer_certificate_id")
    private Certificate issuerCertificate;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "common_name", nullable = false)
    private String commonName; // CN

    @Column(name = "organization_name" , nullable = false)
    private String organizationName; // O

    @Column(name = "organizational_unit")
    private String organizationalUnit; // OU

    @Column(nullable = false, length = 2)
    private String country; // C (country code)

    @Column(name = "email")
    private String email; // E

    @Enumerated(EnumType.STRING)
    @Column(name = "certificate_type", nullable = false)
    private CertificateType certificateType;

    @Column(name = "not_before", nullable = false)
    private LocalDateTime notBefore;

    @Column(name = "not_after", nullable = false)
    private LocalDateTime notAfter;

    @Lob
    @Column(name = "certificate_content", nullable = false, columnDefinition = "BYTEA")
    private byte[] certificateContent; // this is used for downloading certificate

    @Lob
    @Column(name = "public_key", nullable = false, columnDefinition = "BYTEA")
    private byte[] publicKey;

    @Lob
    @Column(name = "private_key_encrypted", columnDefinition = "BYTEA")
    private byte[] privateKeyEncrypted;

    @Column(name = "private_key_downloaded", nullable = false)
    private Boolean privateKeyDownloaded = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CertificateStatus status;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "revocation_reason")
    private RevocationReason revocationReason;

    @Column(name = "extensions", columnDefinition = "TEXT")
    private String extensions; // change type or save as json idk

    @Column(name = "crl_distribution_point")
    private String crlDistributionPoint;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (privateKeyDownloaded == null) {
            privateKeyDownloaded = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return status == CertificateStatus.ACTIVE
                && !now.isBefore(notBefore)
                && !now.isAfter(notAfter);
    }

    public boolean isCACertificate() {
        return certificateType == CertificateType.ROOT
                || certificateType == CertificateType.INTERMEDIATE;
    }
}