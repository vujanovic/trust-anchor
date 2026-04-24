package inc.visor.trustanchor.encryption.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

@Service
@Slf4j
public class KeyManagementService {

    @Value("${master.encryption.key}")
    private String masterKeyHex;

    private SecretKey masterKey;

    @PostConstruct
    public void initializeKMS() {
        log.info("Initializing KMS with master key from Vault...");

        if (masterKeyHex == null || masterKeyHex.isBlank()) {
            log.error("Master key not found in Vault at 'master.encryption.key'");
            throw new IllegalStateException("Master key not found in Vault at 'master.encryption.key'");
        }

        log.info("Master key retrieved from Vault (length: {} characters)", masterKeyHex.length());

        byte[] keyBytes = hexToBytes(masterKeyHex.trim());

        if (keyBytes.length != 32) {
            log.error("Invalid master key length: {} bytes (expected 32 bytes)", keyBytes.length);
            throw new IllegalArgumentException("Master key must be 256-bit (32 bytes / 64 hex characters)");
        }

        this.masterKey = new SecretKeySpec(keyBytes, "AES");

        log.info("✅ Master key initialized successfully from Vault!");
        log.info("Key algorithm: {}", masterKey.getAlgorithm());
        log.info("Key format: {}", masterKey.getFormat());
    }

    public SecretKey getMasterKey() {
        if (masterKey == null) {
            throw new IllegalStateException("Master key not initialized.");
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