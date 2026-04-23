package inc.visor.trustanchor.encryption.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "root_keys")
public class RootKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "key_id", nullable = false)
    private long id;

    @Lob
    @Column(name = "encrypted_key", nullable = false)
    private byte[] encryptedKey;

    @Column(name = "master_key_version", nullable = false)
    private int masterKeyVersion = 1;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

}
