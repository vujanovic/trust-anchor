package inc.visor.trustanchor.authentication.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefreshRequestDto {

    @NotBlank
    private String refreshToken;

    public RefreshRequestDto() {
    }
}
