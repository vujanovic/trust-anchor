package inc.visor.trustanchor.encryption.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "root_keys")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RootKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "key_id", nullable = false)
    private long id;

    @Column(name = "encrypted_key", nullable = false)
    private byte[] encryptedKey;

    @Column(name = "nonce", nullable = false)
    private byte[] nonce;

    @Column(name = "auth_tag", nullable = false)
    private byte[] authTag;

    @Column(name = "master_key_version", nullable = false)
    private int masterKeyVersion = 1;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

}
