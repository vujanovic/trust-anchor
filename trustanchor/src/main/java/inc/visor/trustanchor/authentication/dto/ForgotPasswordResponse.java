package inc.visor.trustanchor.authentication.dto;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordResponse(
        @NotBlank String encryptedChallengeBase64
) { }
