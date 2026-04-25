package inc.visor.trustanchor.config;

import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.repository.OrganizationRepository;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.entity.UserRole;
import inc.visor.trustanchor.user.entity.UserStatus;
import inc.visor.trustanchor.user.repository.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(OrganizationRepository organizationRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        Organization org = organizationRepository.save(
            Organization.builder()
                .name("TrustAnchor Root")
                .code("TRUSTANCHOR")
                .email("root@trustanchor.local")
                .location("Belgrade, Serbia")
                .registrationDate(LocalDateTime.now())
                .build()
        );

        userRepository.save(User.builder()
            .firstName("Admin")
            .lastName("TrustAnchor")
            .email("admin@gmail.com")
            .password(passwordEncoder.encode("test1234"))
            .organization(org)
            .userRole(UserRole.ADMIN)
            .userStatus(UserStatus.ACTIVE)
            .build()
        );

        userRepository.save(User.builder()
            .firstName("CA")
            .lastName("User")
            .email("ca@gmail.com")
            .password(passwordEncoder.encode("test1234"))
            .organization(org)
            .userRole(UserRole.CA_USER)
            .userStatus(UserStatus.ACTIVE)
            .build()
        );

        userRepository.save(User.builder()
            .firstName("Regular")
            .lastName("User")
            .email("user@gmail.com")
            .password(passwordEncoder.encode("test1234"))
            .organization(org)
            .userRole(UserRole.USER)
            .userStatus(UserStatus.ACTIVE)
            .build()
        );
    }
}
