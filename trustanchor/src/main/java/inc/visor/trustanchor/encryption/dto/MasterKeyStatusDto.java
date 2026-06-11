package inc.visor.trustanchor.encryption.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MasterKeyStatusDto(
        int activeVersion,
        LocalDateTime lastRotatedAt,
        int rotationCount,
        String rotationCron,
        LocalDateTime nextScheduledRotation,
        List<RootKeyInfoDto> history
) {
}
