package inc.visor.trustanchor.authentication.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import inc.visor.trustanchor.authentication.dto.LoginDto;
import inc.visor.trustanchor.authentication.dto.LoginResponseDto;
import inc.visor.trustanchor.authentication.dto.RefreshRequestDto;
import inc.visor.trustanchor.authentication.dto.RegistrationDto;
import inc.visor.trustanchor.authentication.entity.RefreshToken;
import inc.visor.trustanchor.email.EmailService;
import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.service.OrganizationService;
import inc.visor.trustanchor.user.dto.UserDto;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.service.UserService;

@Service
public class AuthenticationService {

    private final UserService userService;
    private final EmailService emailService;
    private final OrganizationService organizationService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserDetailsService userDetailsService;

    public AuthenticationService(UserService userService, EmailService emailService,
            OrganizationService organizationService, AuthenticationManager authenticationManager,
            JwtService jwtService, RefreshTokenService refreshTokenService,
            UserDetailsService userDetailsService) {
        this.userService = userService;
        this.emailService = emailService;
        this.organizationService = organizationService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.userDetailsService = userDetailsService;
    }

    public User register(RegistrationDto dto) {
        Organization organization = organizationService.findById(dto.getOrganizationId()).orElseThrow(NotFoundException::new);
        User user = userService.createUser(dto, organization);
        //TODO implement email sending
        return user;
    }

    public LoginResponseDto login(LoginDto loginInfo) {
        var authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(loginInfo.getEmail(), loginInfo.getPassword())
        );

        AnchorUserDetails userDetails = (AnchorUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        refreshTokenService.revokeAllTokensForUser(user);

        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.create(user);

        return new LoginResponseDto(accessToken, refreshToken.getToken(), new UserDto(user));
    }

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

    public void logout(RefreshRequestDto dto) {
        RefreshToken token = refreshTokenService.validate(dto.getRefreshToken());
        refreshTokenService.revoke(token);
    }

}
