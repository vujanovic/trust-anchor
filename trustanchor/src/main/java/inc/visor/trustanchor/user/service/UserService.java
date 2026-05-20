package inc.visor.trustanchor.user.service;

import inc.visor.trustanchor.authentication.dto.RegistrationDto;
import inc.visor.trustanchor.authentication.service.JwtService;
import inc.visor.trustanchor.email.EmailService;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.user.dto.CreateCAUserDto;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.entity.UserRole;
import inc.visor.trustanchor.user.entity.UserStatus;
import inc.visor.trustanchor.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User createUser(RegistrationDto dto, Organization organization) {
        User user = User.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .organization(organization)
                .userStatus(UserStatus.PENDING)
                .userRole(UserRole.USER)
                .publicKey(dto.getPublicKey())
                .build();
        return userRepository.save(user);
    }

    public User createCAUser(CreateCAUserDto dto, Organization organization) {
        User user = User.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .organization(organization)
                .userStatus(UserStatus.PENDING)
                .userRole(UserRole.CA_USER)
                .build();
        emailService.sendVerificationEmail(
                user.getEmail(),
                user.getFirstName(),
                jwtService.generateVerificationToken(user.getEmail())
        );
        return userRepository.save(user);
    }

    public User update(User user) {
        return userRepository.save(user);
    }

    public List<User> findAllByUserRole(UserRole userRole) {
        return userRepository.findAllByUserRole(userRole);
    }

    public void delete(User user) {
        userRepository.delete(user);
    }
}
