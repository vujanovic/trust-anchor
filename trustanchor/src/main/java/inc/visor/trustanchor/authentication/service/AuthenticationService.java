package inc.visor.trustanchor.authentication.service;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import inc.visor.trustanchor.authentication.dto.*;
import inc.visor.trustanchor.authentication.entity.ActivationToken;
import inc.visor.trustanchor.authentication.entity.RefreshToken;
import inc.visor.trustanchor.authentication.entity.ResetPasswordToken;
import inc.visor.trustanchor.authentication.utils.CryptoChallengeUtil;
import inc.visor.trustanchor.email.EmailService;
import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.exception.UnauthorizedAccessException;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.service.OrganizationService;
import inc.visor.trustanchor.user.dto.UserDto;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.entity.UserStatus;
import inc.visor.trustanchor.user.service.UserService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthenticationService {

    private final UserService userService;
    private final EmailService emailService;
    private final OrganizationService organizationService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final ActivationTokenService activationTokenService;
    private final ResetPasswordTokenService resetPasswordTokenService;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final MfaSessionService mfaSessionService;
    private final GAService gaService;

    public AuthenticationService(UserService userService, EmailService emailService,
                                 OrganizationService organizationService, AuthenticationManager authenticationManager,
                                 JwtService jwtService, RefreshTokenService refreshTokenService, ActivationTokenService activationTokenService, ResetPasswordTokenService resetPasswordTokenService,
                                 UserDetailsService userDetailsService, PasswordEncoder passwordEncoder, MfaSessionService mfaSessionService, GAService gaService) {
        this.userService = userService;
        this.emailService = emailService;
        this.organizationService = organizationService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.activationTokenService = activationTokenService;
        this.resetPasswordTokenService = resetPasswordTokenService;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.mfaSessionService = mfaSessionService;
        this.gaService = gaService;
    }

    @Transactional
    public User register(RegistrationDto dto) {
        Organization organization = organizationService.findById(dto.getOrganizationId()).orElseThrow(NotFoundException::new);
        User user = userService.createUser(dto, organization);
        String plainTextChallenge = CryptoChallengeUtil.generateRandomChallenge();
        String encryptedChallenge = "";
        try {
            encryptedChallenge = CryptoChallengeUtil.encryptChallenge(
                    plainTextChallenge,
                    user.getPublicKey()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate secure cryptographic challenge", e);
        }
        ActivationToken activationToken = activationTokenService.create(user, plainTextChallenge, encryptedChallenge);
        emailService.sendActivationEmail(
                user.getEmail(),
                user.getFirstName(),
                activationToken.getToken()
        );

        return user;
    }

    @Transactional
    public void forgotPassword(User user) {
        String plainTextChallenge = CryptoChallengeUtil.generateRandomChallenge();
        String encryptedChallenge = "";
        try {
            encryptedChallenge = CryptoChallengeUtil.encryptChallenge(
                    plainTextChallenge,
                    user.getPublicKey()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate secure cryptographic challenge", e);
        }
        ResetPasswordToken activationToken = resetPasswordTokenService.create(user, plainTextChallenge, encryptedChallenge);
        emailService.sendResetPasswordEmail(
                user.getEmail(),
                user.getFirstName(),
                activationToken.getToken()
        );
    }

    @Transactional
    public LoginResponseDto login(LoginDto loginInfo) {
        var authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(loginInfo.getEmail(), loginInfo.getPassword())
        );

        AnchorUserDetails userDetails = (AnchorUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        if (user.isMfaEnabled()) {
            String mfaToken = mfaSessionService.createMfaSession(user.getId());
            return new LoginResponseDto(true, mfaToken);
        }

        refreshTokenService.revokeAllTokensForUser(user);

        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.create(user);

        return new LoginResponseDto(accessToken, refreshToken.getToken(), new UserDto(user));
    }

    @Transactional
    public LoginResponseDto refresh(RefreshRequestDto dto) {
        RefreshToken oldToken = refreshTokenService.validate(dto.getRefreshToken());
        User user = oldToken.getUser();

        AnchorUserDetails userDetails = (AnchorUserDetails) userDetailsService.loadUserByUsername(user.getEmail());
        if (!userDetails.isEnabled()) {
            refreshTokenService.revokeAllTokensForUser(user);
            throw new DisabledException("Account is disabled");
        }

        refreshTokenService.revoke(oldToken);

        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken newRefreshToken = refreshTokenService.create(userDetails.getUser());

        return new LoginResponseDto(accessToken, newRefreshToken.getToken(), new UserDto(userDetails.getUser()));
    }

    @Transactional
    public void verifyAndActivate(VerificationDto dto) {
        User user = userService.findByEmail(jwtService.extractUsername(dto.getToken()))
                .orElseThrow(() -> new RuntimeException("Invalid or expired authorization token"));
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setUserStatus(UserStatus.ACTIVE);
        userService.update(user);
    }
    @Transactional
    public void activate(ActivationToken activationToken) {
        User user = activationToken.getUser();
        user.setUserStatus(UserStatus.ACTIVE);
        userService.update(user);
        activationToken.setUsed(true);
        activationTokenService.save(activationToken);
    }

    public void logout(RefreshRequestDto dto) {
        RefreshToken token = refreshTokenService.validate(dto.getRefreshToken());
        refreshTokenService.revoke(token);
    }

    public LoginResponseDto generateFullLoginResponse(User user) {
        AnchorUserDetails userDetails = new AnchorUserDetails(user);

        refreshTokenService.revokeAllTokensForUser(user);

        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.create(user);

        return new LoginResponseDto(accessToken, refreshToken.getToken(), new UserDto(user));
    }

    @Transactional
    public LoginResponseDto verifyMfaCode(VerifyMfaDto verifyMfaDto) {
        Long userId = mfaSessionService.getUserIdFromSession(verifyMfaDto.getMfaToken());
        if (userId == null) {
            throw new UnauthorizedAccessException("MFA session expired or invalid");
        }

        User user = userService.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        boolean isValid = gaService.isValid(user.getMfaSecret(), verifyMfaDto.getTotpCode());

        if (!isValid) {
            throw new UnauthorizedAccessException("Invalid 2FA verification code");
        }

        mfaSessionService.invalidateSession(verifyMfaDto.getMfaToken());

        return generateFullLoginResponse(user);
    }

    public Map<String, String> initiateMfaSetup(User currentUser) {

        String secret = new GoogleAuthenticator().createCredentials().getKey();

        // Format: otpauth://totp/Issuer:Label?secret=SECRET&issuer=Issuer
        String companyName = "TrustAnchor";
        String qrCodeUrl = String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s",
                currentUser.getOrganization().getName(), currentUser.getEmail(), secret, companyName);

        Map<String, String> response = new HashMap<>();
        response.put("secretKey", secret);
        response.put("qrCodeUrl", qrCodeUrl);
        return response;
    }

    @Transactional
    public void toggleMfa(User currentUser, MfaToggleDto dto) {
        if (!currentUser.isMfaEnabled()) {
            if (dto.getSecretKey() == null || dto.getSecretKey().isBlank()) {
                throw new IllegalArgumentException("Secret key is required to enable MFA");
            }

            boolean isValid = gaService.isValid(dto.getSecretKey(), dto.getTotpCode());
            if (!isValid) {
                throw new UnauthorizedAccessException("Invalid verification code. Setup failed.");
            }

            currentUser.setMfaSecret(dto.getSecretKey());
            currentUser.setMfaEnabled(true);
        } else {

            boolean isValid = gaService.isValid(currentUser.getMfaSecret(), dto.getTotpCode());
            if (!isValid) {
                throw new UnauthorizedAccessException("Invalid verification code. Cannot disable 2FA.");
            }

            currentUser.setMfaSecret(null);
            currentUser.setMfaEnabled(false);
        }

        userService.update(currentUser);
    }

    public void updatePassword(ResetPasswordToken resetPasswordToken, String password) {
        User user = resetPasswordToken.getUser();
        user.setPassword(passwordEncoder.encode(password));
        userService.update(user);
        resetPasswordToken.setUsed(true);
        resetPasswordTokenService.save(resetPasswordToken);
    }
}
