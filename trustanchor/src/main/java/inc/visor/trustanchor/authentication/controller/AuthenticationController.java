package inc.visor.trustanchor.authentication.controller;

import inc.visor.trustanchor.authentication.dto.*;
import inc.visor.trustanchor.authentication.service.AuthenticationService;
import inc.visor.trustanchor.user.dto.UserDto;
import inc.visor.trustanchor.user.entity.User;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    @Autowired
    AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegistrationDto registrationDto) {
        User user = authenticationService.register(registrationDto);
        return ResponseEntity.ok(new UserDto(user));
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@Valid @RequestBody LoginDto loginDto) {
        return ResponseEntity.ok(new UserDto());
    }

    @PostMapping("/verifyUser")
    public ResponseEntity<Void> verifyUser(@RequestBody VerifyTokenDto token) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgotPassword")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordDto dto) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resetPassword")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordDto dto) {
        return ResponseEntity.ok().build();
    }
}
