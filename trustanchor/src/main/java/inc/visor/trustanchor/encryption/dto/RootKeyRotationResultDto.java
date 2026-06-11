package inc.visor.trustanchor.encryption.dto;

import java.time.LocalDateTime;

public record RootKeyRotationResultDto(
        long previousRootKeyId,
        long newRootKeyId,
        int organizationKeysRewrapped,
        LocalDateTime rotatedAt
) {
}
