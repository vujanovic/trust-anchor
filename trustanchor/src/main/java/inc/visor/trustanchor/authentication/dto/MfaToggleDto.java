package inc.visor.trustanchor.authentication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MfaToggleDto {
    @NotBlank(message = "TOTP code is required")
    @Size(min = 6, max = 6, message = "Code must be 6 digits")
    private String totpCode;

    // needed when ENABLING for the first time
    private String secretKey;

}
