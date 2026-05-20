package inc.visor.trustanchor.authentication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank String decryptedChallenge,
        @NotBlank(message = "Password is required")
        @Size(min = 15, max = 64, message = "Password must be between 15 and 64 characters") String password
)
{}
