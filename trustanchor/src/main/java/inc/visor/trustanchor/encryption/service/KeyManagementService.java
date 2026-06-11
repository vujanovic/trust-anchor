package inc.visor.trustanchor.encryption.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
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
import inc.visor.trustanchor.encryption.dto.MasterKeyRotationResultDto;
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

    // KV v2 path where the init-vault script stores secrets.
    private static final String VAULT_BACKEND = "secret";
    private static final String VAULT_SECRET_PATH = "application";
    private static final String MASTER_KEY_PROPERTY = "master.encryption.key";

    private final RootKeyRepository rootKeyRepository;
    private final EncryptionService encryptionService;
    private final VaultOperations vaultOperations;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${master.encryption.key}")
    private String masterKeyHex;

    private volatile SecretKey masterKey;
    private volatile int masterKeyVersion;

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

    /** Generates a new 256-bit master key, writes it to Vault, and re-wraps the root key under it; synchronized to prevent concurrent rotations. */
    public synchronized MasterKeyRotationResultDto rotateMasterKey() {
        RootKey activeEntity = rootKeyRepository.findByIsActiveTrue()
                .orElseThrow(() -> new IllegalStateException("No active root key found — nothing to re-wrap"));

        int previousVersion = masterKeyVersion;

        // 1) Generate a new 256-bit AES key the same way init-vault.ps1 does during initial setup.
        byte[] newKeyBytes = new byte[ROOT_KEY_SIZE];
        secureRandom.nextBytes(newKeyBytes);
        SecretKey newMasterKey = new SecretKeySpec(newKeyBytes, AES_ALGORITHM);

        // 2) Persist to Vault first so the key is durable before anything is encrypted with it; if this fails the rotation aborts and the old key remains active.
        int newVersion = writeMasterKeyToVault(bytesToHex(newKeyBytes));

        // 3) Re-wrap the same root key value under a fresh nonce and the new master key.
        EncryptedData rewrapped = encryptionService.encrypt(rootKey.getEncoded(), newMasterKey);

        RootKey replacement = RootKey.builder()
                .encryptedKey(rewrapped.ciphertext())
                .nonce(rewrapped.nonce())
                .authTag(rewrapped.authTag())
                .masterKeyVersion(newVersion)
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();

        // Deactivate and wipe the old row's key material so the previous master key can no longer decrypt anything; version/date metadata is kept for audit history.
        activeEntity.setActive(false);
        activeEntity.setEncryptedKey(new byte[0]);
        activeEntity.setNonce(new byte[0]);
        activeEntity.setAuthTag(new byte[0]);

        // saveAll = jedna transakcija: u bazi nikad ne može da osvane 0 ili 2 aktivna root ključa
        rootKeyRepository.saveAll(List.of(activeEntity, replacement));

        // 4) tek na kraju zamena u memoriji — do ove tačke sistem je ceo radio sa starim ključem
        this.masterKey = newMasterKey;
        this.masterKeyVersion = newVersion;

        log.info("Master key rotated: v{} -> v{} (root key re-wrapped; org keys and certificate keys untouched)",
                previousVersion, newVersion);

        return new MasterKeyRotationResultDto(previousVersion, newVersion, LocalDateTime.now());
    }

    private int writeMasterKeyToVault(String newKeyHex) {
        try {
            // read-modify-write: na istoj Vault putanji živi i jwt.secret — ne sme da nestane,
            // jer KV v2 put zamenjuje CEO sadržaj tajne, ne samo jedan ključ
            Versioned<Map<String, Object>> latest = readLatestVaultSecret();
            
            Map<String, Object> data = new HashMap<>();
            
            if (latest != null && latest.getData() != null) {
                data.putAll(latest.getData());
            }
            
            data.put(MASTER_KEY_PROPERTY, newKeyHex);

            Versioned.Metadata metadata = vaultOperations
                    .opsForVersionedKeyValue(VAULT_BACKEND)
                    .put(VAULT_SECRET_PATH, data);

            return metadata.getVersion().getVersion();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to store the new master key in Vault — rotation aborted", e);
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

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
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