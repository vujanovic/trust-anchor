package inc.visor.trustanchor.authentication.controller;

import inc.visor.trustanchor.authentication.dto.MfaToggleDto;
import inc.visor.trustanchor.authentication.service.AuthenticationService;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/2fa")
public class MfaController {


    private final AuthenticationService authenticationService;

    public MfaController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @GetMapping("/setup")
    public ResponseEntity<Map<String, String>> getMfaSetup(@AuthenticationPrincipal AnchorUserDetails userDetails) {
        Map<String, String> setupData = authenticationService.initiateMfaSetup(userDetails.getUser());
        return ResponseEntity.ok(setupData);
    }

    @PostMapping("/toggle")
    public ResponseEntity<Map<String, String>> toggle2fa(
            @AuthenticationPrincipal AnchorUserDetails userDetails,
            @Valid @RequestBody MfaToggleDto toggleDto) {

        authenticationService.toggleMfa(userDetails.getUser(), toggleDto);

        Map<String, String> response = new HashMap<>();
        response.put("message", userDetails.getUser().isMfaEnabled() ? "2FA Enabled" : "2FA Disabled");
        return ResponseEntity.ok(response);
    }
}
