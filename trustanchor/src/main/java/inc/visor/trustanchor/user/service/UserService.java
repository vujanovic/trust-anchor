package inc.visor.trustanchor.user.service;

import inc.visor.trustanchor.authentication.dto.RegistrationDto;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.user.dto.CreateCAUserDto;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.entity.UserRole;
import inc.visor.trustanchor.user.entity.UserStatus;
import inc.visor.trustanchor.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
                .build();
        return userRepository.save(user);
    }

    public User createCAUser(CreateCAUserDto dto, Organization organization) {
        User user = User.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .password(dto.getPassword())
                .organization(organization)
                .userStatus(UserStatus.PENDING)
                .userRole(UserRole.CA_USER)
                .build();
        return userRepository.save(user);
    }

    public User update(User user, CreateCAUserDto userDto) {
        return userRepository.save(user);
    }

    public List<User> findAllByUserRole(UserRole userRole) {
        return userRepository.findAllByUserRole(userRole);
    }

    public void delete(User user) {
        userRepository.delete(user);
    }
}
