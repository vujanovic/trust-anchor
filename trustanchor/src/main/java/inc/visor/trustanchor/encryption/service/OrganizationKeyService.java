package inc.visor.trustanchor.encryption.service;

import java.security.SecureRandom;
import java.util.concurrent.locks.Lock;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import inc.visor.trustanchor.encryption.dto.EncryptedData;
import inc.visor.trustanchor.encryption.entity.OrganizationKey;
import inc.visor.trustanchor.encryption.repository.OrganizationKeyRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrganizationKeyService {

    private static final int ORG_KEY_SIZE = 32;
    private static final String AES_ALGORITHM = "AES";

    private final OrganizationKeyRepository organizationKeyRepository;
    private final EncryptionService encryptionService;
    private final KeyManagementService keyManagementService;

    @Transactional
    public SecretKey getOrCreateOrgKey(long organizationId) {
        // Read lock: org keys must not be read or created while a rotation re-wraps them.
        Lock readLock = keyManagementService.getRootKeyReadLock();
        readLock.lock();
        try {
            return organizationKeyRepository
                    .findFirstByOrganizationIdAndIsActiveTrueOrderByCreatedAtDesc(organizationId)
                    .map(this::decryptOrgKey)
                    .orElseGet(() -> generateAndStoreOrgKey(organizationId));
        } finally {
            readLock.unlock();
        }
    }

    private SecretKey generateAndStoreOrgKey(long orgId) {
        byte[] keyBytes = new byte[ORG_KEY_SIZE];
        new SecureRandom().nextBytes(keyBytes);

        EncryptedData encrypted = encryptionService.encrypt(keyBytes, keyManagementService.getRootKey());

        OrganizationKey entity = OrganizationKey.builder()
                .organizationId(orgId)
                .encryptedKey(encrypted.ciphertext())
                .nonce(encrypted.nonce())
                .authTag(encrypted.authTag())
                .build();

        organizationKeyRepository.save(entity);

        return new SecretKeySpec(keyBytes, AES_ALGORITHM);
    }

    private SecretKey decryptOrgKey(OrganizationKey entity) {
        EncryptedData data = new EncryptedData(
                entity.getEncryptedKey(),
                entity.getNonce(),
                entity.getAuthTag()
        );
        byte[] keyBytes = encryptionService.decrypt(data, keyManagementService.getRootKey());
        return new SecretKeySpec(keyBytes, AES_ALGORITHM);
    }
}
