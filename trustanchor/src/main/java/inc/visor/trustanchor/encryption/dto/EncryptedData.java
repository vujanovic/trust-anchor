package inc.visor.trustanchor.encryption.dto;

public record EncryptedData(
        byte[] ciphertext,
        byte[] nonce,
        byte[] authTag
) {}