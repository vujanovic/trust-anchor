package inc.visor.trustanchor.authentication.dto;

import jakarta.validation.constraints.NotBlank;

public record ActivationDetailsResponse(
        @NotBlank String encryptedChallengeBase64
) {}