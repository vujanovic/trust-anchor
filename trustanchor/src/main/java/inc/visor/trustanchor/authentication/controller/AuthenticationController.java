package inc.visor.trustanchor.authentication.controller;

import inc.visor.trustanchor.authentication.dto.*;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import inc.visor.trustanchor.authentication.service.AuthenticationService;
import inc.visor.trustanchor.user.dto.UserDto;
import inc.visor.trustanchor.user.entity.User;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.Map;

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
    public ResponseEntity<Void> verifyUser(@RequestBody VerificationDto dto) {
        authenticationService.verifyAndActivate(dto);
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

    @PostMapping("/verify-2fa")
    public ResponseEntity<LoginResponseDto> verify2fa(@Valid @RequestBody VerifyMfaDto verifyMfaDto) {
        LoginResponseDto response = authenticationService.verifyMfaCode(verifyMfaDto);
        return ResponseEntity.ok(response);
    }
}
