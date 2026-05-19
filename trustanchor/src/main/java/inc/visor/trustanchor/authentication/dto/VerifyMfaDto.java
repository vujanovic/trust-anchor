package inc.visor.trustanchor.authentication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyMfaDto {

    @NotBlank(message = "MFA session token is required")
    private String mfaToken;

    @NotBlank(message = "TOTP code is required")
    @Size(min = 6, max = 6, message = "TOTP code must be exactly 6 digits")
    private String totpCode;

    public VerifyMfaDto() {}

    public VerifyMfaDto(String mfaToken, String totpCode) {
        this.mfaToken = mfaToken;
        this.totpCode = totpCode;
    }

}