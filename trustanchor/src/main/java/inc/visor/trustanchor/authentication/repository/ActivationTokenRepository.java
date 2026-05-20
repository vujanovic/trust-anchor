package inc.visor.trustanchor.authentication.repository;

import inc.visor.trustanchor.authentication.entity.ActivationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ActivationTokenRepository extends JpaRepository<ActivationToken, Long> {
    Optional<ActivationToken> findByToken(String token);
}
