package inc.visor.trustanchor.authentication.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefreshRequestDto {
    private String refreshToken;

    public RefreshRequestDto() {
    }
}
