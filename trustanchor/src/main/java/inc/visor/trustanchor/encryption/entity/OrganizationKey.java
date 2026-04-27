package inc.visor.trustanchor.encryption.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Setter
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

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

}
