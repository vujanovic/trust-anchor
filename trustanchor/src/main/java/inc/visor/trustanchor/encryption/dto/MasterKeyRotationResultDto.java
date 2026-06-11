package inc.visor.trustanchor.encryption.dto;

import java.time.LocalDateTime;

public record MasterKeyRotationResultDto(
        int previousVersion,
        int newVersion,
        LocalDateTime rotatedAt
) {
}
