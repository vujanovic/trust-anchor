package inc.visor.trustanchor.encryption.dto;

public record EncryptedData(
        byte[] ciphertext,
        byte[] nonce,
        byte[] authTag
) {
    private static final int NONCE_LENGTH    = 12;
    private static final int AUTH_TAG_LENGTH = 16;

    public byte[] pack() {
        byte[] out = new byte[NONCE_LENGTH + ciphertext.length + AUTH_TAG_LENGTH];
        System.arraycopy(nonce,      0, out, 0,                              NONCE_LENGTH);
        System.arraycopy(ciphertext, 0, out, NONCE_LENGTH,                   ciphertext.length);
        System.arraycopy(authTag,    0, out, NONCE_LENGTH + ciphertext.length, AUTH_TAG_LENGTH);
        return out;
    }

    public static EncryptedData unpack(byte[] packed) {
        if (packed.length < NONCE_LENGTH + AUTH_TAG_LENGTH) {
            throw new IllegalArgumentException("Invalid packed key length: " + packed.length);
        }
        byte[] nonce      = new byte[NONCE_LENGTH];
        byte[] authTag    = new byte[AUTH_TAG_LENGTH];
        byte[] ciphertext = new byte[packed.length - NONCE_LENGTH - AUTH_TAG_LENGTH];
        System.arraycopy(packed, 0,                                nonce,      0, NONCE_LENGTH);
        System.arraycopy(packed, NONCE_LENGTH,                     ciphertext, 0, ciphertext.length);
        System.arraycopy(packed, NONCE_LENGTH + ciphertext.length, authTag,    0, AUTH_TAG_LENGTH);
        return new EncryptedData(ciphertext, nonce, authTag);
    }
}