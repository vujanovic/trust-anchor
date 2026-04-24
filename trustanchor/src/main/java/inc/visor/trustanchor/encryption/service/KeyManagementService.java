package inc.visor.trustanchor.encryption.service;

import inc.visor.trustanchor.encryption.dto.EncryptedData;
import inc.visor.trustanchor.encryption.entity.RootKey;
import inc.visor.trustanchor.encryption.repository.RootKeyRepository;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class KeyManagementService {


    private static final int ROOT_KEY_SIZE = 32;
    private static final String AES_ALGORITHM = "AES";

    private final RootKeyRepository rootKeyRepository;
    private final EncryptionService encryptionService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${master.encryption.key}")
    private String masterKeyHex;

    private SecretKey masterKey;

    @Getter
    private SecretKey rootKey;

    @PostConstruct
    @Transactional
    public void initializeKMS() {
        initializeMasterKey();
        initializeRootKey();
    }

    private void initializeMasterKey() {
        if (masterKeyHex == null || masterKeyHex.isBlank()) {
            log.error("PLEASE RUN THE SETUP THAT YOU WERE TOLD TO RUN AAAAAAAAAAAAAAAAAAAAAA");
            throw new IllegalStateException("Master key not found in Vault at 'master.encryption.key'");
        }

        byte[] keyBytes = hexToBytes(masterKeyHex.trim());

        if (keyBytes.length != 32) {
            log.error("Invalid master key length: {} bytes (expected 32 bytes)", keyBytes.length);
            throw new IllegalArgumentException("Master key must be 256-bit (32 bytes / 64 hex characters)");
        }

        this.masterKey = new SecretKeySpec(keyBytes, AES_ALGORITHM);

        log.info("Master key initialized successfully from Vault!");
        log.info("Key algorithm: {}", masterKey.getAlgorithm());
        log.info("Key format: {}", masterKey.getFormat());
    }

    private void initializeRootKey() {
        try {
            Optional<RootKey> existingRootKey = rootKeyRepository.findByIsActiveTrue();

            if (existingRootKey.isPresent()) {
                log.info("Active root key found ID: {})", existingRootKey.get().getId());
                this.rootKey = decryptRootKey(existingRootKey.get());
                log.info("Root key loaded and decrypted");
            } else {
                log.info("No active root key found in database. Generating new root key...");
                this.rootKey = generateAndStoreRootKey();
                log.info("New root key generated");
            }

        } catch (Exception e) {
            log.error("Failed to initialize root key", e);
            throw new IllegalStateException("Failed to initialize root key", e);
        }
    }

    private SecretKey generateAndStoreRootKey() throws Exception {

        byte[] rootKeyBytes = new byte[ROOT_KEY_SIZE];
        secureRandom.nextBytes(rootKeyBytes);

        SecretKey newRootKey = new SecretKeySpec(rootKeyBytes, AES_ALGORITHM);

        EncryptedData encryptedData = encryptionService.encrypt(rootKeyBytes, masterKey);

        RootKey rootKeyEntity = RootKey.builder()
                .encryptedKey(encryptedData.ciphertext())
                .nonce(encryptedData.nonce())
                .authTag(encryptedData.authTag())
                .masterKeyVersion(1)
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();

        rootKeyRepository.save(rootKeyEntity);

        log.info("Root key encrypted with master key and saved (ID: {})", rootKeyEntity.getId());

        return newRootKey;
    }

    private SecretKey decryptRootKey(RootKey rootKeyEntity) throws Exception {

        EncryptedData data = new EncryptedData(rootKeyEntity.getEncryptedKey(), rootKeyEntity.getNonce(), rootKeyEntity.getAuthTag());
        byte[] decryptedKeyBytes = encryptionService.decrypt(data, masterKey);

        return new SecretKeySpec(decryptedKeyBytes, AES_ALGORITHM);
    }

    public SecretKey getMasterKey() {
        if (masterKey == null) {
            throw new IllegalStateException("Master key not initialized");
        }
        return masterKey;
    }

    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}