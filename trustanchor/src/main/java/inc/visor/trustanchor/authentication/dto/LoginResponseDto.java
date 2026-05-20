package inc.visor.trustanchor.authentication.dto;

import inc.visor.trustanchor.user.dto.UserDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponseDto {
    private String accessToken;
    private String refreshToken;
    private UserDto user;

    private boolean mfaRequired;
    private String mfaToken;

    public LoginResponseDto(String accessToken, String refreshToken, UserDto user) {
        this.mfaRequired = false;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
    }

    public LoginResponseDto(boolean mfaRequired, String mfaToken) {
        this.mfaRequired = mfaRequired;
        this.mfaToken = mfaToken;
    }
}
