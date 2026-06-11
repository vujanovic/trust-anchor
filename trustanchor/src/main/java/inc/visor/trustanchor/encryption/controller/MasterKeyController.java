package inc.visor.trustanchor.encryption.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import inc.visor.trustanchor.encryption.dto.MasterKeyRotationResultDto;
import inc.visor.trustanchor.encryption.dto.MasterKeyStatusDto;
import inc.visor.trustanchor.encryption.dto.RootKeyInfoDto;
import inc.visor.trustanchor.encryption.entity.RootKey;
import inc.visor.trustanchor.encryption.service.KeyManagementService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/master-key")
@RequiredArgsConstructor
public class MasterKeyController {

    private final KeyManagementService keyManagementService;

    @Value("${master-key.rotation.cron}")
    private String rotationCron;

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<MasterKeyStatusDto> getStatus() {
        List<RootKey> history = keyManagementService.getRootKeyHistory();

        LocalDateTime lastRotatedAt = history.stream()
                .filter(RootKey::isActive)
                .map(RootKey::getCreatedAt)
                .findFirst()
                .orElse(null);

        MasterKeyStatusDto status = new MasterKeyStatusDto(
                keyManagementService.getMasterKeyVersion(),
                lastRotatedAt,
                Math.max(history.size() - 1, 0),
                rotationCron,
                CronExpression.parse(rotationCron).next(LocalDateTime.now()),
                history.stream().map(RootKeyInfoDto::new).toList()
        );

        return ResponseEntity.ok(status);
    }

    @PostMapping("/rotate")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<MasterKeyRotationResultDto> rotate() {
        return ResponseEntity.ok(keyManagementService.rotateMasterKey());
    }
}
