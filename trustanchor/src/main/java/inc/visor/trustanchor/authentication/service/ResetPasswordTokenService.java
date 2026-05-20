package inc.visor.trustanchor.authentication.service;

import inc.visor.trustanchor.authentication.entity.ResetPasswordToken;
import inc.visor.trustanchor.authentication.repository.ResetPasswordTokenRepository;
import inc.visor.trustanchor.exception.InvalidTokenException;
import inc.visor.trustanchor.user.entity.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ResetPasswordTokenService {
    private final ResetPasswordTokenRepository resetPasswordTokenRepository;

    public ResetPasswordTokenService(ResetPasswordTokenRepository resetPasswordTokenRepository) {
        this.resetPasswordTokenRepository = resetPasswordTokenRepository;
    }

    public ResetPasswordToken create(User user, String plainTextChallenge, String encryptedChallenge) {
        ResetPasswordToken ResetPasswordToken = new ResetPasswordToken();
        ResetPasswordToken.setToken(UUID.randomUUID().toString());
        ResetPasswordToken.setUser(user);
        ResetPasswordToken.setPlainTextChallenge(plainTextChallenge);
        ResetPasswordToken.setEncryptedChallengeBase64(encryptedChallenge);
        ResetPasswordToken.setExpiresAt(LocalDateTime.now().plusHours(24));
        ResetPasswordToken.setUsed(false);
        return resetPasswordTokenRepository.save(ResetPasswordToken);
    }

    public ResetPasswordToken save(ResetPasswordToken ResetPasswordToken) {
        return this.resetPasswordTokenRepository.save(ResetPasswordToken);
    }

    public ResetPasswordToken validate(String token) {
        ResetPasswordToken resetPasswordToken = resetPasswordTokenRepository.findByToken(token).orElseThrow();

        if (resetPasswordToken.isExpired()) {
            throw new InvalidTokenException("Refresh token is expired");
        }

        if (resetPasswordToken.isUsed()) {
            throw new InvalidTokenException("Refresh token is used");
        }

        return resetPasswordToken;
    }
}
