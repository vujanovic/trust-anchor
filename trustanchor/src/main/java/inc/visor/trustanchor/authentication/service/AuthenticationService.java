package inc.visor.trustanchor.authentication.service;

import inc.visor.trustanchor.authentication.dto.RegistrationDto;
import inc.visor.trustanchor.email.EmailService;
import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.service.OrganizationService;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    private final UserService userService;
    private final EmailService emailService;
    private final OrganizationService organizationService;

    @Autowired
    public AuthenticationService(UserService userService, EmailService emailService, OrganizationService organizationService) {
        this.userService = userService;
        this.emailService = emailService;
        this.organizationService = organizationService;
    }

    public User register(RegistrationDto dto) {
        Organization organization = organizationService.findById(dto.getOrganizationId()).orElseThrow(NotFoundException::new);
        User user = userService.createUser(dto, organization);
        //TODO implement email sending
        return user;
    }

}
