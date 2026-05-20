package inc.visor.trustanchor.authentication.controller;

import inc.visor.trustanchor.authentication.dto.*;
import inc.visor.trustanchor.authentication.entity.ActivationToken;
import inc.visor.trustanchor.authentication.entity.ResetPasswordToken;
import inc.visor.trustanchor.authentication.service.ActivationTokenService;
import inc.visor.trustanchor.authentication.service.AuthenticationService;
import inc.visor.trustanchor.authentication.service.ResetPasswordTokenService;
import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.user.dto.UserDto;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final UserService userService;
    private final ActivationTokenService activationTokenService;
    private final ResetPasswordTokenService resetPasswordTokenService;

    public AuthenticationController(AuthenticationService authenticationService, UserService userService, ActivationTokenService activationTokenService, ResetPasswordTokenService resetPasswordTokenService) {
        this.authenticationService = authenticationService;
        this.userService = userService;
        this.activationTokenService = activationTokenService;
        this.resetPasswordTokenService = resetPasswordTokenService;
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

    @PostMapping("/verify-user")
    public ResponseEntity<Void> verifyUser(@RequestBody VerificationDto dto) {
        authenticationService.verifyAndActivate(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userService.findByEmail(request.email()).orElseThrow(NotFoundException::new);
        authenticationService.forgotPassword(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password-details")
    public ResponseEntity<?> getResetPasswordDetails(@RequestParam String token) {
        ResetPasswordToken resetPasswordToken = resetPasswordTokenService.validate(token);
        return ResponseEntity.ok(new ForgotPasswordResponse(
                resetPasswordToken.getEncryptedChallengeBase64()
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        ResetPasswordToken resetPasswordToken = resetPasswordTokenService.validate(request.token());
        String serverChallenge = resetPasswordToken.getPlainTextChallenge();
        String userDecryptedResult = request.decryptedChallenge().trim();
        if (!serverChallenge.equals(userDecryptedResult)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Cryptographic identity validation failed. Private key mismatch.");
        }
        authenticationService.updatePassword(resetPasswordToken, request.password());
        return ResponseEntity.ok("Identity verified successfully. Password is updated.");
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<LoginResponseDto> verify2fa(@Valid @RequestBody VerifyMfaDto verifyMfaDto) {
        LoginResponseDto response = authenticationService.verifyMfaCode(verifyMfaDto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/activation-details")
    public ResponseEntity<?> getActivationDetails(@RequestParam String token) {
        ActivationToken activationToken = activationTokenService.validate(token);
        return ResponseEntity.ok(new ActivationDetailsResponse(
                activationToken.getEncryptedChallengeBase64()
        ));
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activateAccount(@RequestBody ActivationSubmitRequest request) {
        ActivationToken activationToken = activationTokenService.validate(request.token());
        String serverChallenge = activationToken.getPlainTextChallenge();
        String userDecryptedResult = request.decryptedChallenge().trim();
        if (!serverChallenge.equals(userDecryptedResult)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Cryptographic identity validation failed. Private key mismatch.");
        }
        authenticationService.activate(activationToken);
        return ResponseEntity.ok("Identity verified successfully. Account is now active.");
    }
}
