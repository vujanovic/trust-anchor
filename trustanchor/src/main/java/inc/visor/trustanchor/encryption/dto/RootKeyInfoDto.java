package inc.visor.trustanchor.encryption.dto;

import java.time.LocalDateTime;

import inc.visor.trustanchor.encryption.entity.RootKey;

public record RootKeyInfoDto(
        long id,
        int masterKeyVersion,
        LocalDateTime createdAt,
        boolean active
) {
    public RootKeyInfoDto(RootKey rootKey) {
        this(rootKey.getId(), rootKey.getMasterKeyVersion(), rootKey.getCreatedAt(), rootKey.isActive());
    }
}
