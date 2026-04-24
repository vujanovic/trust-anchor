package inc.visor.trustanchor.encryption.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Base64;

@Getter
@Entity
@Table(name = "organization_keys")
public class OrganizationKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "organization_id", nullable = false)
    private long organizationId;

    @Column(name = "encrypted_key", nullable = false)
    private byte[] encryptedKey;

    @Column(name = "nonce", nullable = false)
    private byte[] nonce;

    @Column(name = "auth_tag", nullable = false)
    private byte[] authTag;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

}
