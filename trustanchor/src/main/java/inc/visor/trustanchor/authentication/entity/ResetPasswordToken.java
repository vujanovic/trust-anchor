package inc.visor.trustanchor.authentication.entity;

import inc.visor.trustanchor.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "reset_password_tokens")
@Getter
@Setter
@NoArgsConstructor
public class ResetPasswordToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private String plainTextChallenge;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedChallengeBase64;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
