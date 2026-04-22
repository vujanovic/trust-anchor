package inc.visor.trustanchor.user.controller;

import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.entity.UserRole;
import inc.visor.trustanchor.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    @Autowired
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping()
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable long id) {
        return ResponseEntity.ok(userService.findById(id).orElseThrow(NotFoundException::new));
    }

    @GetMapping("/role")
    public ResponseEntity<List<User>> getAllUsersByRole(UserRole userRole) {
        return ResponseEntity.ok(userService.findAllByUserRole(userRole));
    }
}
