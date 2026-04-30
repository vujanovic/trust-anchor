package inc.visor.trustanchor.user.controller;

import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.service.OrganizationService;
import inc.visor.trustanchor.user.dto.CreateCAUserDto;
import inc.visor.trustanchor.user.dto.UserDto;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.entity.UserRole;
import inc.visor.trustanchor.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    @Autowired
    private final UserService userService;

    @Autowired
    private final OrganizationService organizationService;

    public UserController(UserService userService, OrganizationService organizationService) {
        this.userService = userService;
        this.organizationService = organizationService;
    }

    @GetMapping()
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll().stream().map(UserDto::new).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable long id) {
        final User user = userService.findById(id).orElseThrow(NotFoundException::new);
        return ResponseEntity.ok(new UserDto(user));
    }

    @GetMapping("/role")
    public ResponseEntity<List<UserDto>> getAllUsersByRole(@RequestParam UserRole userRole) {
        return ResponseEntity.ok(userService.findAllByUserRole(userRole).stream().map(UserDto::new).toList());
    }

    @PostMapping("/ca")
    public ResponseEntity<UserDto> createCAUser(@Valid @RequestBody CreateCAUserDto userDto) {
        final Organization organization = organizationService.findById(userDto.getOrganizationId()).orElseThrow(NotFoundException::new);
        final User user = userService.createCAUser(userDto, organization);
        return ResponseEntity.ok(new UserDto(user));
    }

    @DeleteMapping("/ca/{id}")
    public ResponseEntity<Void> deleteCAUser(@PathVariable long id) {
        final User user = userService.findById(id).orElseThrow(NotFoundException::new);
        userService.delete(user);
        return ResponseEntity.ok().build();
    }
}