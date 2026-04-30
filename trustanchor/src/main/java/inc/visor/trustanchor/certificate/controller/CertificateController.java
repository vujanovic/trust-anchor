package inc.visor.trustanchor.certificate.controller;

import inc.visor.trustanchor.certificate.dto.CertificateDto;
import inc.visor.trustanchor.certificate.dto.IssueCertificateDto;
import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.service.CertificateGenerationService;
import inc.visor.trustanchor.certificate.service.CertificateService;
import inc.visor.trustanchor.exception.UnauthorizedAccessException;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;
import inc.visor.trustanchor.user.entity.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final CertificateGenerationService certificateGenerationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<List<CertificateDto>> getMyCertificates() {
        return ResponseEntity.ok(certificateService.getCertificates().stream().map(CertificateDto::new).toList());
    }

    @GetMapping("/me")
    public ResponseEntity<List<CertificateDto>> getMyCertificates(
            @AuthenticationPrincipal AnchorUserDetails currentUser) {
        if (currentUser == null) throw new UnauthorizedAccessException("Forbidden Access");
        List<CertificateDto> certs = certificateService.getUserCertificates(currentUser.getId())
                .stream().map(CertificateDto::new).collect(Collectors.toList());
        return ResponseEntity.ok(certs);
    }

    @PostMapping("/issue")
    @PreAuthorize("hasAnyRole('ADMIN', 'CA_USER')")
    public ResponseEntity<CertificateDto> issueCertificate(
            @Valid @RequestBody IssueCertificateDto dto,
            @AuthenticationPrincipal AnchorUserDetails currentUser) {
        if (currentUser == null) throw new UnauthorizedAccessException("Forbidden Access");
        try {
            Certificate certificate = certificateGenerationService.issue(dto, currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(new CertificateDto(certificate));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/issuers")
    @PreAuthorize("hasAnyRole('ADMIN', 'CA_USER')")
    public ResponseEntity<List<CertificateDto>> getAvailableIssuers(
            @AuthenticationPrincipal AnchorUserDetails currentUser) {
        Long orgId = currentUser.getUser().getOrganization().getId();
        UserRole role = currentUser.getUser().getUserRole();
        List<CertificateDto> issuers = certificateService.getAvailableIssuers(orgId, role)
                .stream().map(CertificateDto::new).collect(Collectors.toList());
        return ResponseEntity.ok(issuers);
    }

    @GetMapping("/organization")
    @PreAuthorize("hasAnyRole('ADMIN', 'CA_USER')")
    public ResponseEntity<List<CertificateDto>> getOrganizationCertificates(
            @RequestParam(required = false) Long orgId,
            @AuthenticationPrincipal AnchorUserDetails currentUser) {
        Long resolvedOrgId;
        if (currentUser.getUser().getUserRole() == UserRole.CA_USER) {
            resolvedOrgId = currentUser.getUser().getOrganization().getId();
        } else {
            resolvedOrgId = orgId != null ? orgId : currentUser.getUser().getOrganization().getId();
        }
        List<CertificateDto> certs = certificateService.getOrganizationCertificates(resolvedOrgId)
                .stream().map(CertificateDto::new).collect(Collectors.toList());
        return ResponseEntity.ok(certs);
    }
}
