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

    public LoginResponseDto(String accessToken, String refreshToken, UserDto user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
    }
}
