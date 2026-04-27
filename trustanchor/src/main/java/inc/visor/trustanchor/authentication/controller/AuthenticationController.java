package inc.visor.trustanchor.authentication.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import inc.visor.trustanchor.authentication.dto.ForgotPasswordDto;
import inc.visor.trustanchor.authentication.dto.LoginDto;
import inc.visor.trustanchor.authentication.dto.LoginResponseDto;
import inc.visor.trustanchor.authentication.dto.RefreshRequestDto;
import inc.visor.trustanchor.authentication.dto.RegistrationDto;
import inc.visor.trustanchor.authentication.dto.ResetPasswordDto;
import inc.visor.trustanchor.authentication.dto.VerifyTokenDto;
import inc.visor.trustanchor.authentication.service.AuthenticationService;
import inc.visor.trustanchor.user.dto.UserDto;
import inc.visor.trustanchor.user.entity.User;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegistrationDto registrationDto) {
        User user = authenticationService.register(registrationDto);
        return ResponseEntity.ok(new UserDto(user));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginDto loginDto) {
        LoginResponseDto response = authenticationService.login(loginDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDto> refresh(@Valid @RequestBody RefreshRequestDto refreshRequest) {
        LoginResponseDto response = authenticationService.refresh(refreshRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequestDto refreshRequest) {
        authenticationService.logout(refreshRequest);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verifyUser")
    public ResponseEntity<Void> verifyUser(@RequestBody VerifyTokenDto token) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgotPassword")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordDto dto) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resetPassword")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordDto dto) {
        return ResponseEntity.ok().build();
    }
}
