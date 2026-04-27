package inc.visor.trustanchor.authentication.service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import inc.visor.trustanchor.authentication.entity.RefreshToken;
import inc.visor.trustanchor.authentication.repository.RefreshTokenRepository;
import inc.visor.trustanchor.exception.InvalidTokenException;
import inc.visor.trustanchor.user.entity.User;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    
    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public RefreshToken create(User user) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(generateRandomToken());
        refreshToken.setExpiresAt(generateExpirationDate());
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revokeAllTokensForUser(User user) {
        refreshTokenRepository.revokeAllByUser(user);
    }

    private String generateRandomToken() {
        return UUID.randomUUID().toString();
    }

    private Instant generateExpirationDate() {
        return Instant.now().plus(Duration.ofDays(7));
    }

    public void revoke(RefreshToken refreshToken) {
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken validate(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
            .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Refresh token is expired or revoked");
        }

        return refreshToken;
    }
}
