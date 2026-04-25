package inc.visor.trustanchor.certificate.controller;


import com.sun.security.auth.UserPrincipal;
import inc.visor.trustanchor.certificate.dto.CertificateDto;
import inc.visor.trustanchor.certificate.service.CertificateService;
import inc.visor.trustanchor.exception.UnauthorizedAccessException;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;
import inc.visor.trustanchor.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping
    public ResponseEntity<List<CertificateDto>> getMyCertificates(@AuthenticationPrincipal AnchorUserDetails currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Forbidden Access");
        }
        List<CertificateDto> certificates = certificateService.getUserCertificates(currentUser.getId()).stream().map(CertificateDto::new).collect(Collectors.toList());
        return ResponseEntity.ok(certificates);
    }
}
