package inc.visor.trustanchor.encryption.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private static final String ENV_MASTER_KEY = "MASTER_ENCRYPTION_KEY";

    private final RootKeyRepository rootKeyRepository;
    private final EncryptionService encryptionService;
    private final VaultOperations vaultOperations;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${master.encryption.key}")
    private String masterKeyHex;

    @Value("${master-key.rotation.env-file:./.env}")
    private String envFilePath;

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
                RootKey entity = existingRootKey.get();
                log.info("Active root key found (ID: {}, wrapped with master key v{})", entity.getId(), entity.getMasterKeyVersion());

                if (entity.getMasterKeyVersion() == masterKeyVersion) {
                    this.rootKey = decryptRootKey(entity, masterKey);
                    
                    log.info("Root key loaded and decrypted");
                } else {
                    // Interrupted rotation or stale .env re-sync: unwrap with the historic
                    // key version from KV v2, then re-wrap under the current master key.
                    log.warn("Root key wrapped with master key v{} but current is v{} — re-wrapping",
                            entity.getMasterKeyVersion(), masterKeyVersion);
                    
                    this.rootKey = decryptRootKey(entity, fetchMasterKeyVersion(entity.getMasterKeyVersion()));
                    
                    replaceActiveRootKey(entity, masterKey, masterKeyVersion);
                    
                    log.info("Root key re-wrapped under master key v{}", masterKeyVersion);
                }
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
        String newKeyHex = bytesToHex(newKeyBytes);
        SecretKey newMasterKey = new SecretKeySpec(newKeyBytes, AES_ALGORITHM);

        // 2) Persist to Vault first so the key is durable before anything is encrypted with it; if this fails the rotation aborts and the old key remains active.
        int newVersion = writeMasterKeyToVault(newKeyHex);

        // 3) Re-wrap the same root key value under a fresh nonce and the new master key.
        replaceActiveRootKey(activeEntity, newMasterKey, newVersion);

        // Keep .env in sync — start-vault.ps1 re-syncs it into Vault on every boot.
        updateEnvFile(newKeyHex);

        // 4) Swap the in-memory key last; until this point the system ran on the old key.
        this.masterKey = newMasterKey;
        this.masterKeyVersion = newVersion;

        log.info("Master key rotated: v{} -> v{} (root key re-wrapped; org keys and certificate keys untouched)",
                previousVersion, newVersion);

        return new MasterKeyRotationResultDto(previousVersion, newVersion, LocalDateTime.now());
    }

    private int writeMasterKeyToVault(String newKeyHex) {
        try {
            // Read-modify-write: KV v2 put replaces the whole secret, so keep jwt.secret intact.
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

    private RootKey replaceActiveRootKey(RootKey oldEntity, SecretKey wrappingKey, int wrappingKeyVersion) {
        EncryptedData rewrapped = encryptionService.encrypt(rootKey.getEncoded(), wrappingKey);

        RootKey replacement = RootKey.builder()
                .encryptedKey(rewrapped.ciphertext())
                .nonce(rewrapped.nonce())
                .authTag(rewrapped.authTag())
                .masterKeyVersion(wrappingKeyVersion)
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();

        // Deactivate and wipe the old row so the previous master key can no longer decrypt anything.
        oldEntity.setActive(false);
        oldEntity.setEncryptedKey(new byte[0]);
        oldEntity.setNonce(new byte[0]);
        oldEntity.setAuthTag(new byte[0]);

        // saveAll runs in a single transaction — never zero or two active root keys.
        rootKeyRepository.saveAll(List.of(oldEntity, replacement));

        return replacement;
    }

    private SecretKey fetchMasterKeyVersion(int version) {
        Versioned<Map<String, Object>> secret = vaultOperations
                .opsForVersionedKeyValue(VAULT_BACKEND)
                .get(VAULT_SECRET_PATH, Versioned.Version.from(version));

        if (secret == null || secret.getData() == null
                || !(secret.getData().get(MASTER_KEY_PROPERTY) instanceof String hex)) {
            throw new IllegalStateException("Master key v" + version + " not found in Vault — cannot unwrap the root key");
        }

        return toAesKey(hex);
    }

    private void updateEnvFile(String newKeyHex) {
        Path path = Path.of(envFilePath);
        try {
            if (!Files.exists(path)) {
                log.warn(".env not found at {} — update {} manually", path.toAbsolutePath(), ENV_MASTER_KEY);
                return;
            }

            List<String> lines = new ArrayList<>(Files.readAllLines(path, StandardCharsets.UTF_8));
            boolean replaced = false;
            for (int i = 0; i < lines.size(); i++) {
                if (lines.get(i).startsWith(ENV_MASTER_KEY + "=")) {
                    lines.set(i, ENV_MASTER_KEY + "=" + newKeyHex);
                    replaced = true;
                    break;
                }
            }
            if (!replaced) {
                lines.add(ENV_MASTER_KEY + "=" + newKeyHex);
            }

            Files.write(path, lines, StandardCharsets.UTF_8);
            log.info("{} updated in {}", ENV_MASTER_KEY, path.toAbsolutePath());
        } catch (IOException e) {
            // Best effort — startup self-heal recovers if a stale key gets re-synced later.
            log.warn("Could not update {} — refresh {} manually", path.toAbsolutePath(), ENV_MASTER_KEY, e);
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

    private SecretKey decryptRootKey(RootKey rootKeyEntity, SecretKey wrappingKey) throws Exception {

        EncryptedData data = new EncryptedData(rootKeyEntity.getEncryptedKey(), rootKeyEntity.getNonce(), rootKeyEntity.getAuthTag());
        byte[] decryptedKeyBytes = encryptionService.decrypt(data, wrappingKey);

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