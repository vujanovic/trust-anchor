package inc.visor.trustanchor.authentication.service;

import inc.visor.trustanchor.authentication.dto.RegistrationDto;
import inc.visor.trustanchor.email.EmailService;
import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.service.OrganizationService;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    private final UserService userService;
    private final EmailService emailService;
    private final OrganizationService organizationService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthenticationService(UserService userService, EmailService emailService, OrganizationService organizationService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.emailService = emailService;
        this.organizationService = organizationService;
        this.passwordEncoder = passwordEncoder;
    }

    public void register(RegistrationDto registrationDto) {
        Organization organization = organizationService.findById(registrationDto.getOrganizationId()).orElseThrow(NotFoundException::new);
        User user = new User(registrationDto, passwordEncoder.encode(registrationDto.getPassword()), organization);
        userService.create(user);
        //TODO implement email sending
    }

}
