package inc.visor.trustanchor.encryption.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import inc.visor.trustanchor.encryption.dto.MasterKeyRotationResultDto;
import inc.visor.trustanchor.encryption.service.KeyManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class MasterKeyRotationScheduler {

    private final KeyManagementService keyManagementService;

    @Scheduled(cron = "${master-key.rotation.cron}")
    public void rotateMasterKeyPeriodically() {
        try {
            MasterKeyRotationResultDto result = keyManagementService.rotateMasterKey();
            log.info("Scheduled master key rotation: v{} -> v{}", result.previousVersion(), result.newVersion());
        } catch (Exception e) {
            // Log and stay alive — the next scheduled run retries.
            log.error("Scheduled master key rotation failed", e);
        }
    }
}
