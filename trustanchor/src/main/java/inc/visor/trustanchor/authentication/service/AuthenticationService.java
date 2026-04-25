package inc.visor.trustanchor.authentication.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import inc.visor.trustanchor.authentication.dto.LoginDto;
import inc.visor.trustanchor.authentication.dto.LoginResponseDto;
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

    public AuthenticationService(UserService userService, EmailService emailService,
            OrganizationService organizationService, AuthenticationManager authenticationManager,
            JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.userService = userService;
        this.emailService = emailService;
        this.organizationService = organizationService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public User register(RegistrationDto dto) {
        Organization organization = organizationService.findById(dto.getOrganizationId()).orElseThrow(NotFoundException::new);
        User user = userService.createUser(dto, organization);
        //TODO implement email sending
        return user;
    }

    public LoginResponseDto login(LoginDto loginInfo) {
        // Throws BadCredentialsException if credentials are wrong, DisabledException if not ACTIVE
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

}
