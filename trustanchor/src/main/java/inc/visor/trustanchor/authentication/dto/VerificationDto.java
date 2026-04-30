package inc.visor.trustanchor.authentication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerificationDto {

    @NotBlank(message = "Security token is missing")
    private String token;

    @NotBlank(message = "Password is required")
    @Size(min = 15, max = 64, message = "Password must be between 15 and 64 characters")
    private String password;
}