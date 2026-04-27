package inc.visor.trustanchor.certificate.service;

import java.io.ByteArrayInputStream;
import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Security;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.X500NameBuilder;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.bouncycastle.asn1.x509.BasicConstraints;
import org.bouncycastle.asn1.x509.ExtendedKeyUsage;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.KeyPurposeId;
import org.bouncycastle.asn1.x509.KeyUsage;
import org.bouncycastle.cert.jcajce.JcaX509ExtensionUtils;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import inc.visor.trustanchor.certificate.dto.ExtensionsDto;
import inc.visor.trustanchor.certificate.dto.IssueCertificateDto;
import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.enums.CertificateStatus;
import inc.visor.trustanchor.certificate.enums.CertificateType;
import inc.visor.trustanchor.certificate.repository.CertificateRepository;
import inc.visor.trustanchor.encryption.dto.EncryptedData;
import inc.visor.trustanchor.encryption.service.EncryptionService;
import inc.visor.trustanchor.encryption.service.OrganizationKeyService;
import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;
import inc.visor.trustanchor.user.entity.UserRole;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CertificateGenerationService {

    private static final String SIGN_ALGORITHM = "SHA256withRSA";
    private static final int KEY_SIZE = 2048;
    private static final int NONCE_LENGTH = 12;
    private static final int AUTH_TAG_LENGTH = 16;

    private final CertificateRepository certificateRepository;
    private final EncryptionService encryptionService;
    private final OrganizationKeyService orgKeyService;

    @PostConstruct
    public void registerBCProvider() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    @Transactional
    public Certificate issue(IssueCertificateDto dto, AnchorUserDetails currentUser) {

        // 1. Load issuer
        Certificate issuerCert = certificateRepository.findById(dto.getIssuerCertificateId())
                .orElseThrow(() -> new NotFoundException("Issuer certificate not found"));

        // 2. Must be ROOT or INTERMEDIATE
        if (!issuerCert.isCACertificate()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Issuer must be a CA certificate (ROOT or INTERMEDIATE)");
        }

        // 3. Must be currently valid (ACTIVE + within date range)
        if (!issuerCert.isValid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Issuer certificate is expired or revoked");
        }

        // 4. Verify digital signature
        verifyIssuerSignature(issuerCert);

        // 5. CA_USER may only use issuers from their own organization
        if (currentUser.getUser().getUserRole() == UserRole.CA_USER) {
            long userOrgId = currentUser.getUser().getOrganization().getId();
            if (userOrgId != issuerCert.getOrganizationId()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "CA users may only issue certificates for their own organization");
            }
        }

        // 6. CA_USER cannot issue ROOT certificates
        if (currentUser.getUser().getUserRole() == UserRole.CA_USER
                && dto.getCertificateType() == CertificateType.ROOT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "CA users may only issue INTERMEDIATE or END_ENTITY certificates");
        }

        // 7. Validity range must be coherent and fall within issuer's validity window
        if (!dto.getNotBefore().isBefore(dto.getNotAfter())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "notBefore must be before notAfter");
        }
        if (dto.getNotBefore().isBefore(issuerCert.getNotBefore())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Certificate notBefore cannot precede issuer notBefore ("
                            + issuerCert.getNotBefore() + ")");
        }
        if (dto.getNotAfter().isAfter(issuerCert.getNotAfter())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Certificate validity period cannot exceed issuer validity period ("
                            + issuerCert.getNotAfter() + ")");
        }

        try {
            long orgId = currentUser.getUser().getOrganization().getId();

            // 8. Decrypt issuer private key
            java.security.PrivateKey issuerPrivKey = decryptCertificatePrivateKey(issuerCert);

            // 9. Parse issuer X.509 certificate
            X509Certificate issuerX509 = parseX509(issuerCert.getCertificateContent());

            // 10. Generate RSA 2048 key pair
            KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA", BouncyCastleProvider.PROVIDER_NAME);
            gen.initialize(KEY_SIZE, new SecureRandom());
            KeyPair keyPair = gen.generateKeyPair();

            // 11. Build subject DN
            X500NameBuilder nameBuilder = new X500NameBuilder(BCStyle.INSTANCE);
            nameBuilder.addRDN(BCStyle.CN, dto.getCommonName());
            nameBuilder.addRDN(BCStyle.O, dto.getOrganizationName());
            if (dto.getOrganizationalUnit() != null && !dto.getOrganizationalUnit().isBlank()) {
                nameBuilder.addRDN(BCStyle.OU, dto.getOrganizationalUnit());
            }
            nameBuilder.addRDN(BCStyle.C, dto.getCountry());
            if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
                nameBuilder.addRDN(BCStyle.E, dto.getEmail());
            }
            X500Name subjectDN = nameBuilder.build();

            // 12. 128-bit random positive serial number
            BigInteger serial = new BigInteger(128, new SecureRandom()).abs();

            // 13. Build X509v3 certificate
            Date notBefore = Date.from(dto.getNotBefore().atZone(ZoneId.systemDefault()).toInstant());
            Date notAfter  = Date.from(dto.getNotAfter().atZone(ZoneId.systemDefault()).toInstant());

            JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    issuerX509, serial, notBefore, notAfter, subjectDN, keyPair.getPublic());

            // 14. Add extensions
            addExtensions(certBuilder, dto.getExtensions(), keyPair.getPublic(), issuerX509.getPublicKey());

            // 15. Sign
            ContentSigner signer = new JcaContentSignerBuilder(SIGN_ALGORITHM)
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .build(issuerPrivKey);
            byte[] certDer = certBuilder.build(signer).getEncoded();

            // 16. Encrypt new private key: nonce(12) || ciphertext || authTag(16)
            SecretKey orgKey = orgKeyService.getOrCreateOrgKey(orgId);
            EncryptedData enc = encryptionService.encrypt(keyPair.getPrivate().getEncoded(), orgKey);
            byte[] packedPrivKey = packEncrypted(enc);

            // 17. Persist
            Certificate cert = new Certificate();
            cert.setSerialNumber(serial.toString(16));
            cert.setIssuerCertificate(issuerCert);
            cert.setOrganizationId(orgId);
            cert.setUserId(currentUser.getUser().getId());
            cert.setCommonName(dto.getCommonName());
            cert.setOrganizationName(dto.getOrganizationName());
            cert.setOrganizationalUnit(dto.getOrganizationalUnit());
            cert.setCountry(dto.getCountry());
            cert.setEmail(dto.getEmail());
            cert.setCertificateType(dto.getCertificateType());
            cert.setNotBefore(dto.getNotBefore());
            cert.setNotAfter(dto.getNotAfter());
            cert.setCertificateContent(certDer);
            cert.setPublicKey(keyPair.getPublic().getEncoded());
            cert.setPrivateKeyEncrypted(packedPrivKey);
            cert.setStatus(CertificateStatus.ACTIVE);
            cert.setExtensions(extensionsToJson(dto.getExtensions()));

            return certificateRepository.save(cert);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Certificate generation failed: " + e.getMessage(), e);
        }
    }

    private void verifyIssuerSignature(Certificate issuerCert) {
        try {
            X509Certificate x509 = parseX509(issuerCert.getCertificateContent());
            PublicKey verifyKey = (issuerCert.getIssuerCertificate() == null)
                    ? x509.getPublicKey()
                    : parseX509(issuerCert.getIssuerCertificate().getCertificateContent()).getPublicKey();
            x509.verify(verifyKey, BouncyCastleProvider.PROVIDER_NAME);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Issuer certificate has an invalid digital signature");
        }
    }

    private java.security.PrivateKey decryptCertificatePrivateKey(Certificate cert) throws Exception {
        EncryptedData enc = unpackEncrypted(cert.getPrivateKeyEncrypted());
        SecretKey orgKey = orgKeyService.getOrCreateOrgKey(cert.getOrganizationId());
        byte[] keyBytes = encryptionService.decrypt(enc, orgKey);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
    }

    private X509Certificate parseX509(byte[] der) throws Exception {
        return (X509Certificate) CertificateFactory.getInstance("X.509")
                .generateCertificate(new ByteArrayInputStream(der));
    }

    private void addExtensions(JcaX509v3CertificateBuilder builder, ExtensionsDto ext,
                                PublicKey subjectKey, PublicKey issuerKey) throws Exception {
        JcaX509ExtensionUtils utils = new JcaX509ExtensionUtils();

        builder.addExtension(Extension.subjectKeyIdentifier, false,
                utils.createSubjectKeyIdentifier(subjectKey));

        builder.addExtension(Extension.authorityKeyIdentifier, false,
                utils.createAuthorityKeyIdentifier(issuerKey));

        boolean isCA = Boolean.TRUE.equals(ext.isCA());
        builder.addExtension(Extension.basicConstraints, true, new BasicConstraints(isCA));

        int keyUsageBits = buildKeyUsageBits(ext);
        if (keyUsageBits != 0) {
            builder.addExtension(Extension.keyUsage, true, new KeyUsage(keyUsageBits));
        }

        if (ext.extendedKeyUsages() != null && !ext.extendedKeyUsages().isEmpty()) {
            List<KeyPurposeId> purposes = new ArrayList<>();
            for (String eku : ext.extendedKeyUsages()) {
                switch (eku) {
                    case "serverAuth"       -> purposes.add(KeyPurposeId.id_kp_serverAuth);
                    case "clientAuth"       -> purposes.add(KeyPurposeId.id_kp_clientAuth);
                    case "emailProtection"  -> purposes.add(KeyPurposeId.id_kp_emailProtection);
                    case "codeSigning"      -> purposes.add(KeyPurposeId.id_kp_codeSigning);
                }
            }
            if (!purposes.isEmpty()) {
                builder.addExtension(Extension.extendedKeyUsage, false,
                        new ExtendedKeyUsage(purposes.toArray(KeyPurposeId[]::new)));
            }
        }
    }

    private int buildKeyUsageBits(ExtensionsDto ext) {
        int bits = 0;
        if (Boolean.TRUE.equals(ext.keyCertSign()))      bits |= KeyUsage.keyCertSign;
        if (Boolean.TRUE.equals(ext.crlSign()))           bits |= KeyUsage.cRLSign;
        if (Boolean.TRUE.equals(ext.digitalSignature()))  bits |= KeyUsage.digitalSignature;
        if (Boolean.TRUE.equals(ext.keyEncipherment()))   bits |= KeyUsage.keyEncipherment;
        if (Boolean.TRUE.equals(ext.dataEncipherment()))  bits |= KeyUsage.dataEncipherment;
        if (Boolean.TRUE.equals(ext.nonRepudiation()))    bits |= KeyUsage.nonRepudiation;
        return bits;
    }

    private byte[] packEncrypted(EncryptedData enc) {
        byte[] out = new byte[NONCE_LENGTH + enc.ciphertext().length + AUTH_TAG_LENGTH];
        System.arraycopy(enc.nonce(),      0, out, 0,                                      NONCE_LENGTH);
        System.arraycopy(enc.ciphertext(), 0, out, NONCE_LENGTH,                           enc.ciphertext().length);
        System.arraycopy(enc.authTag(),    0, out, NONCE_LENGTH + enc.ciphertext().length, AUTH_TAG_LENGTH);
        return out;
    }

    private EncryptedData unpackEncrypted(byte[] packed) {
        if (packed.length < NONCE_LENGTH + AUTH_TAG_LENGTH) {
            throw new IllegalArgumentException("Invalid packed key length: " + packed.length);
        }
        byte[] nonce      = new byte[NONCE_LENGTH];
        byte[] authTag    = new byte[AUTH_TAG_LENGTH];
        byte[] ciphertext = new byte[packed.length - NONCE_LENGTH - AUTH_TAG_LENGTH];
        System.arraycopy(packed, 0,                               nonce,      0, NONCE_LENGTH);
        System.arraycopy(packed, NONCE_LENGTH,                    ciphertext, 0, ciphertext.length);
        System.arraycopy(packed, NONCE_LENGTH + ciphertext.length, authTag,   0, AUTH_TAG_LENGTH);
        return new EncryptedData(ciphertext, nonce, authTag);
    }

    private String extensionsToJson(ExtensionsDto ext) {
        StringBuilder sb = new StringBuilder("{");
        appendBool(sb, "isCA", ext.isCA());
        appendBool(sb, "keyCertSign", ext.keyCertSign());
        appendBool(sb, "crlSign", ext.crlSign());
        appendBool(sb, "digitalSignature", ext.digitalSignature());
        appendBool(sb, "keyEncipherment", ext.keyEncipherment());
        appendBool(sb, "dataEncipherment", ext.dataEncipherment());
        appendBool(sb, "nonRepudiation", ext.nonRepudiation());
        if (ext.extendedKeyUsages() != null && !ext.extendedKeyUsages().isEmpty()) {
            sb.append("\"extendedKeyUsages\":[");
            for (int i = 0; i < ext.extendedKeyUsages().size(); i++) {
                sb.append('"').append(ext.extendedKeyUsages().get(i)).append('"');
                if (i < ext.extendedKeyUsages().size() - 1) sb.append(',');
            }
            sb.append("],");
        }
        if (sb.charAt(sb.length() - 1) == ',') sb.setLength(sb.length() - 1);
        sb.append('}');
        return sb.toString();
    }

    private void appendBool(StringBuilder sb, String key, Boolean value) {
        if (value != null) sb.append('"').append(key).append("\":").append(value).append(',');
    }
}
