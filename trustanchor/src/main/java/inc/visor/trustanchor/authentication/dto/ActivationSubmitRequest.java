package inc.visor.trustanchor.authentication.dto;

import jakarta.validation.constraints.NotBlank;

public record ActivationSubmitRequest(
        @NotBlank String token,
        @NotBlank String decryptedChallenge
) {}