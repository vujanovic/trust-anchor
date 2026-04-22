package inc.visor.trustanchor.authentication.controller;

import inc.visor.trustanchor.authentication.dto.RegistrationDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegistrationDto registrationDto) {
        return ResponseEntity.ok("User registered successfully");
    }

}
