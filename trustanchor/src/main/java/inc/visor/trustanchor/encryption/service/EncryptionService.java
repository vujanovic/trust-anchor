package inc.visor.trustanchor.encryption.service;

import inc.visor.trustanchor.encryption.dto.EncryptedData;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

@Service
@Slf4j
public class EncryptionService {

    private static final int GCM_NONCE_LENGTH = 12; // BYTES
    private static final int GCM_TAG_LENGTH = 128; // BITS!!!!!!!!
    private static final String AES_GCM_CIPHER = "AES/GCM/NoPadding";

    private final SecureRandom secureRandom = new SecureRandom();

    public EncryptedData encrypt(byte[] unencrypted, SecretKey key) {
        try {
            byte[] nonce = new byte[GCM_NONCE_LENGTH];
            secureRandom.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance(AES_GCM_CIPHER);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, nonce);
            cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec);

            byte[] cipherText = cipher.doFinal(unencrypted);

            byte[] encryptedData = new byte[cipherText.length - (GCM_TAG_LENGTH / 8)];
            byte[] authTag = new byte[GCM_TAG_LENGTH / 8];
            System.arraycopy(cipherText, 0, encryptedData, 0, encryptedData.length);
            System.arraycopy(cipherText, encryptedData.length, authTag, 0, authTag.length);

            return new EncryptedData(encryptedData, nonce, authTag);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public byte[] decrypt(EncryptedData encryptedData, SecretKey key) {
        try {

            byte[] fullCipher = new byte[encryptedData.ciphertext().length + encryptedData.authTag().length];

            System.arraycopy(encryptedData.ciphertext(), 0, fullCipher, 0, encryptedData.ciphertext().length);
            System.arraycopy(encryptedData.authTag(), 0, fullCipher, encryptedData.ciphertext().length, encryptedData.authTag().length);

            Cipher cipher = Cipher.getInstance(AES_GCM_CIPHER);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, encryptedData.nonce());
            cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec);

            return cipher.doFinal(fullCipher);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

}
