package inc.visor.trustanchor.authentication.service;

import inc.visor.trustanchor.authentication.entity.ActivationToken;
import inc.visor.trustanchor.authentication.repository.ActivationTokenRepository;
import inc.visor.trustanchor.exception.InvalidTokenException;
import inc.visor.trustanchor.user.entity.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ActivationTokenService {

    private final ActivationTokenRepository activationTokenRepository;

    public ActivationTokenService(ActivationTokenRepository activationTokenRepository) {
        this.activationTokenRepository = activationTokenRepository;
    }

    public ActivationToken create(User user, String plainTextChallenge, String encryptedChallenge) {
        ActivationToken activationToken = new ActivationToken();
        activationToken.setToken(UUID.randomUUID().toString());
        activationToken.setUser(user);
        activationToken.setPlainTextChallenge(plainTextChallenge);
        activationToken.setEncryptedChallengeBase64(encryptedChallenge);
        activationToken.setExpiresAt(LocalDateTime.now().plusHours(24));
        activationToken.setUsed(false);
        return activationTokenRepository.save(activationToken);
    }

    public ActivationToken save(ActivationToken activationToken) {
        return this.activationTokenRepository.save(activationToken);
    }

    public ActivationToken validate(String token) {
        ActivationToken activationToken = activationTokenRepository.findByToken(token).orElseThrow();

        if (activationToken.isExpired()) {
            throw new InvalidTokenException("Refresh token is expired");
        }

        if (activationToken.isUsed()) {
            throw new InvalidTokenException("Refresh token is used");
        }

        return activationToken;
    }
}
