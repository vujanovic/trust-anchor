package inc.visor.trustanchor.authentication.controller;

import inc.visor.trustanchor.authentication.dto.*;
import inc.visor.trustanchor.authentication.entity.ActivationToken;
import inc.visor.trustanchor.authentication.repository.ActivationTokenRepository;
import inc.visor.trustanchor.authentication.service.AuthenticationService;
import inc.visor.trustanchor.user.dto.UserDto;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.entity.UserStatus;
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
    private final ActivationTokenRepository activationTokenRepository;

    public AuthenticationController(AuthenticationService authenticationService, UserService userService, ActivationTokenRepository activationTokenRepository) {
        this.authenticationService = authenticationService;
        this.userService = userService;
        this.activationTokenRepository = activationTokenRepository;
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

    @GetMapping("/api/v1/auth/activation-details")
    public ResponseEntity<?> getActivationDetails(@RequestParam String token) {
        ActivationToken activationToken = activationTokenRepository.findByToken(token).orElseThrow();

        if (activationToken.isUsed() || activationToken.isExpired()) {
            return ResponseEntity.badRequest().body("Token is invalid, expired, or already consumed.");
        }

        return ResponseEntity.ok(new ActivationDetailsResponse(
                activationToken.getEncryptedChallengeBase64()
        ));
    }

    @PostMapping("/api/v1/auth/activate")
    public ResponseEntity<?> activateAccount(@RequestBody ActivationSubmitRequest request) {
        ActivationToken activationToken = activationTokenRepository.findByToken(request.token()).orElseThrow();

        if (activationToken.isUsed() || activationToken.isExpired()) {
            return ResponseEntity.badRequest().body("Token signature cannot be verified.");
        }

        String serverChallenge = activationToken.getPlainTextChallenge();
        String userDecryptedResult = request.decryptedChallenge().trim();

        if (!serverChallenge.equals(userDecryptedResult)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Cryptographic identity validation failed. Private key mismatch.");
        }

        User user = activationToken.getUser();
        user.setUserStatus(UserStatus.ACTIVE);
        userService.update(user);

        activationToken.setUsed(true); // Terminate token single-use capability
        activationTokenRepository.save(activationToken);

        return ResponseEntity.ok("Identity verified successfully. Account is now active.");
    }
}
