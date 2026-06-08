package inc.visor.trustanchor.certificate.controller;

import java.security.PrivateKey;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import inc.visor.trustanchor.certificate.dto.*;
import inc.visor.trustanchor.certificate.entity.Request;
import inc.visor.trustanchor.certificate.enums.CertificateStatus;
import inc.visor.trustanchor.certificate.service.CsrService;
import inc.visor.trustanchor.exception.NotFoundException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.service.CertificateDownloadService;
import inc.visor.trustanchor.certificate.service.CertificateGenerationService;
import inc.visor.trustanchor.certificate.service.CertificateService;
import inc.visor.trustanchor.exception.UnauthorizedAccessException;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;
import inc.visor.trustanchor.user.entity.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final CertificateGenerationService certificateGenerationService;
    private final CertificateDownloadService certificateDownloadService;
    private final CsrService csrService;

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

    @GetMapping("/revoked")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<List<CertificateDto>> getRevokedCertificates(@AuthenticationPrincipal AnchorUserDetails currentUser) {
        if (currentUser == null) throw new UnauthorizedAccessException("Forbidden Access");
        List<CertificateDto> certs = certificateService.getAllRevokedCertificates()
                .stream().map(CertificateDto::new).collect(Collectors.toList());
        return ResponseEntity.ok(certs);
    }

    @PostMapping("/issue")
    @PreAuthorize("hasAnyRole('ADMIN', 'CA_USER')")
    public ResponseEntity<CertificateDto> issueCertificate(
            @Valid @RequestBody IssueCertificateDto dto,
            @AuthenticationPrincipal AnchorUserDetails currentUser) throws Exception {
        if (currentUser == null) throw new UnauthorizedAccessException("Forbidden Access");
        Certificate certificate = certificateGenerationService.issue(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CertificateDto(certificate));
    }


    @GetMapping("/issuers")
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

    @PostMapping("/{id}/download/pkcs12")
    public ResponseEntity<byte[]> downloadPkcs12(
            @PathVariable Long id,
            @Valid @RequestBody DownloadPkcs12Request request,
            @AuthenticationPrincipal AnchorUserDetails currentUser) throws Exception {
        byte[] pkcs12 = certificateDownloadService.downloadPkcs12(id, request.password(), currentUser);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"certificate.p12\"")
            .contentType(MediaType.parseMediaType("application/x-pkcs12"))
            .body(pkcs12);
    }

    @PostMapping("/{id}/download/pem")
    public ResponseEntity<byte[]> downloadPem(
            @PathVariable Long id,
            @AuthenticationPrincipal AnchorUserDetails currentUser) throws Exception {
        byte[] pem = certificateDownloadService.downloadPem(id, currentUser);
        String filename = String.format("certificate_%d.pem", id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(pem);
    }

    @PostMapping("/{id}/download/cer")
    public ResponseEntity<byte[]> downloadCer(
            @PathVariable Long id,
            @AuthenticationPrincipal AnchorUserDetails currentUser) throws Exception {
        byte[] cer = certificateDownloadService.downloadCer(id, currentUser);
        String filename = String.format("certificate_%d.cer", id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/x-x509-ca-cert"))
                .body(cer);
    }

    @PostMapping("/request/generate")
    public ResponseEntity<byte[]> autogenerateCertificate(@Valid @RequestBody CertificateRequestDto dto,
                                                          @AuthenticationPrincipal AnchorUserDetails currentUser) throws Exception {

        if (currentUser == null) throw new UnauthorizedAccessException("Forbidden Access");
        if (!currentUser.getUser().getEmail().equals(dto.getEmail())) {
            throw new UnauthorizedAccessException("You can only request certificate for yourself");
        }
        IssueCertificateDto issueDto = new IssueCertificateDto(dto);

        Pair<Certificate, PrivateKey> pair = certificateGenerationService.issueWithoutPrivateKey(issueDto, currentUser);

        byte[] pkcs12 = certificateDownloadService.bundlePrivateKeyWithCertIntoPkcs12S(pair.first, pair.second, dto.getPassword());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"certificate.p12\"")
                .contentType(MediaType.parseMediaType("application/x-pkcs12"))
                .body(pkcs12);

    }

    @PostMapping(value = "/request/upload", consumes = "multipart/form-data")
    public ResponseEntity<String> uploadCertificate(@Valid @ModelAttribute CsrUploadDto dto, @AuthenticationPrincipal AnchorUserDetails currentUser) throws Exception {

        if (currentUser == null) {
            throw new UnauthorizedAccessException("Forbidden Access");
        }

        String filename = dto.getCsrFile().getOriginalFilename();
        LocalDate startDate = dto.getValidFrom();

        Request request = new Request(dto);
        request.setUserId(currentUser.getUser().getId());
        csrService.saveCsr(request);

        return ResponseEntity.ok("Successfully read file: " + filename + " starting on " + startDate);
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('CA_USER')")
    public ResponseEntity<List<CsrDashboardResponse>> getRequests(@AuthenticationPrincipal AnchorUserDetails currentUser) throws Exception {
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Forbidden Access");
        }
        long caUserId = currentUser.getUser().getId();

        List<CsrDashboardResponse> dashboardData = csrService.getDashboardRequestsForCa(caUserId);
        return ResponseEntity.ok(dashboardData);
    }

    @PostMapping("/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('CA_USER')")
    public ResponseEntity<HttpStatus> approveRequest(@PathVariable Long id, @AuthenticationPrincipal AnchorUserDetails currentUser) throws Exception {
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Forbidden Access");
        }
        certificateGenerationService.processCsrApproval(id);
        return ResponseEntity.ok(HttpStatus.OK);
    }

    @PostMapping("/requests/{id}/reject")
    @PreAuthorize("hasAnyRole('CA_USER')")
    public ResponseEntity<HttpStatus> rejectRequest(@PathVariable Long id, @AuthenticationPrincipal AnchorUserDetails currentUser) throws Exception {
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Forbidden Access");
        }
        csrService.rejectById(id);
        return ResponseEntity.ok(HttpStatus.OK);
    }

    @PostMapping("revoke")
    public ResponseEntity<CertificateDto> revokeCertificate(@RequestBody CertificateRevocationDto revocationDto, @AuthenticationPrincipal AnchorUserDetails currentUser) {
        if (currentUser == null) throw new UnauthorizedAccessException("Forbidden Access");
        Certificate certificate = certificateService.revokeCertificate(revocationDto.getCertificateId(), revocationDto.getRevocationReason(), currentUser);
        return ResponseEntity.ok(new CertificateDto(certificate));
    }

    @GetMapping("/{id}/validate")
    public ResponseEntity<?> validateCertificateChain(@PathVariable Long id) {
        boolean isValid = certificateService.isCertificateChainValid(id);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }
}
