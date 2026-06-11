package inc.visor.trustanchor.encryption.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.vault.core.VaultOperations;
import org.springframework.vault.support.Versioned;

import inc.visor.trustanchor.encryption.dto.EncryptedData;
import inc.visor.trustanchor.encryption.entity.RootKey;
import inc.visor.trustanchor.encryption.repository.RootKeyRepository;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class KeyManagementService {


    private static final int ROOT_KEY_SIZE = 32;
    private static final String AES_ALGORITHM = "AES";

    // KV v2 putanja na kojoj init-vault skripta drži tajne: secret/application
    private static final String VAULT_BACKEND = "secret";
    private static final String VAULT_SECRET_PATH = "application";
    private static final String MASTER_KEY_PROPERTY = "master.encryption.key";

    private final RootKeyRepository rootKeyRepository;
    private final EncryptionService encryptionService;
    private final VaultOperations vaultOperations;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${master.encryption.key}")
    private String masterKeyHex;

    private SecretKey masterKey;
    private int masterKeyVersion;

    @Getter
    private SecretKey rootKey;

    @PostConstruct
    @Transactional
    public void initializeKMS() {
        initializeMasterKey();
        initializeRootKey();
    }

    private void initializeMasterKey() {
        Versioned<Map<String, Object>> latest = readLatestVaultSecret();

        if (latest != null && latest.getData() != null
                && latest.getData().get(MASTER_KEY_PROPERTY) instanceof String hexFromVault) {
            this.masterKey = toAesKey(hexFromVault);
            this.masterKeyVersion = latest.getVersion().getVersion();
            log.info("Master key v{} loaded from Vault ({}/{})", masterKeyVersion, VAULT_BACKEND, VAULT_SECRET_PATH);
            return;
        }

        if (masterKeyHex == null || masterKeyHex.isBlank()) {
            log.error("PLEASE RUN THE SETUP THAT YOU WERE TOLD TO RUN AAAAAAAAAAAAAAAAAAAAAA");
            throw new IllegalStateException("Master key not found in Vault at 'master.encryption.key'");
        }

        this.masterKey = toAesKey(masterKeyHex);
        this.masterKeyVersion = 1;
        log.warn("Versioned Vault read unavailable; master key loaded from configuration property (treated as v1)");
    }

    private Versioned<Map<String, Object>> readLatestVaultSecret() {
        try {
            return vaultOperations.opsForVersionedKeyValue(VAULT_BACKEND).get(VAULT_SECRET_PATH);
        } catch (Exception e) {
            log.warn("Could not read versioned secret from Vault: {}", e.getMessage());
            return null;
        }
    }

    private SecretKey toAesKey(String hex) {
        byte[] keyBytes = hexToBytes(hex.trim());

        if (keyBytes.length != 32) {
            log.error("Invalid master key length: {} bytes (expected 32 bytes)", keyBytes.length);
            throw new IllegalArgumentException("Master key must be 256-bit (32 bytes / 64 hex characters)");
        }

        return new SecretKeySpec(keyBytes, AES_ALGORITHM);
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
                .masterKeyVersion(masterKeyVersion)
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();

        rootKeyRepository.save(rootKeyEntity);

        log.info("Root key encrypted with master key v{} and saved (ID: {})", masterKeyVersion, rootKeyEntity.getId());

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