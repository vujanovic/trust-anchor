package inc.visor.trustanchor.certificate.service;

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
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.entity.UserRole;
import inc.visor.trustanchor.user.service.UserService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.X500NameBuilder;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.cert.jcajce.JcaX509ExtensionUtils;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.io.ByteArrayInputStream;
import java.math.BigInteger;
import java.security.*;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CertificateGenerationService {

    private static final String SIGN_ALGORITHM = "SHA256withRSA";
    private static final int KEY_SIZE = 2048;

    private final CertificateRepository certificateRepository;
    private final EncryptionService encryptionService;
    private final OrganizationKeyService orgKeyService;
    private final UserService userService;

    @PostConstruct
    public void registerBCProvider() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    @Transactional
    public Certificate issue(IssueCertificateDto dto, AnchorUserDetails currentUser) throws Exception {

        boolean isRoot = dto.getCertificateType() == CertificateType.ROOT;
        Certificate issuerCert = null;
        X509Certificate issuerX509 = null;
        java.security.PrivateKey issuerPrivKey = null;

        if (!isRoot) {
            if (dto.getIssuerCertificateId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Issuer certificate ID is required for non-ROOT certificates");
            }
            issuerCert = certificateRepository.findById(dto.getIssuerCertificateId())
                    .orElseThrow(() -> new NotFoundException("Issuer certificate not found"));

            if (!issuerCert.isCACertificate()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Issuer must be a CA certificate (ROOT or INTERMEDIATE)");
            }

            validateIssuerChain(issuerCert);

            if (currentUser.getUser().getUserRole() == UserRole.CA_USER) {
                long userOrgId = currentUser.getUser().getOrganization().getId();
                if (userOrgId != issuerCert.getOrganizationId()) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "CA users may only use issuers from their own organization");
                }
            }

            if (dto.getCertificateType() == CertificateType.ROOT) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "CA users may only issue INTERMEDIATE or END_ENTITY certificates");
            }

            if (!dto.getNotBefore().isBefore(dto.getNotAfter())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "notBefore must be before notAfter");
            }
            if (dto.getNotBefore().isBefore(issuerCert.getNotBefore().truncatedTo(ChronoUnit.MINUTES))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Certificate notBefore cannot precede issuer notBefore ("
                                + issuerCert.getNotBefore() + ")");
            }
            if (dto.getNotAfter().isAfter(issuerCert.getNotAfter())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Certificate validity period cannot exceed issuer validity period ("
                                + issuerCert.getNotAfter() + ")");
            }

            issuerPrivKey = decryptCertificatePrivateKey(issuerCert);
            issuerX509 = parseX509(issuerCert.getCertificateContent());
        } else {
            if (currentUser.getUser().getUserRole() != UserRole.ADMIN) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Only ADMIN can issue ROOT certificates");
            }
            if (!dto.getNotBefore().isBefore(dto.getNotAfter())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "notBefore must be before notAfter");
            }
        }

        User targetUser = null;
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            targetUser = userService.findByEmail(dto.getEmail())
                    .orElseThrow(() -> new NotFoundException("Target user's email not found"));
            if (!isRoot && currentUser.getUser().getUserRole() == UserRole.CA_USER) {
                long userOrgId = currentUser.getUser().getOrganization().getId();
                long targetUserOrgId = targetUser.getOrganization().getId();
                if (userOrgId != targetUserOrgId) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "CA users may only issue certificates for users in their own organization");
                }
            }
        }

        ExtensionsDto ext = normalizeExtensions(dto.getExtensions(), dto.getCertificateType());

        try {
            long orgId = currentUser.getUser().getOrganization().getId();
            KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA", BouncyCastleProvider.PROVIDER_NAME);
            gen.initialize(KEY_SIZE, new SecureRandom());
            KeyPair keyPair = gen.generateKeyPair();
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
            BigInteger serial = new BigInteger(128, new SecureRandom()).abs();
            Date notBefore = Date.from(dto.getNotBefore().atZone(ZoneId.systemDefault()).toInstant());
            Date notAfter  = Date.from(dto.getNotAfter().atZone(ZoneId.systemDefault()).toInstant());
            X500Name issuerDN;
            java.security.PrivateKey signingKey;
            PublicKey issuerPublicKey;

            if (isRoot) {
                issuerDN = subjectDN;
                signingKey = keyPair.getPrivate();
                issuerPublicKey = keyPair.getPublic();
            } else {
                issuerDN = X500Name.getInstance(issuerX509.getSubjectX500Principal());
                signingKey = issuerPrivKey;
                issuerPublicKey = issuerX509.getPublicKey();
            }

            JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    issuerDN, serial, notBefore, notAfter, subjectDN, keyPair.getPublic());
            addExtensions(certBuilder, ext, keyPair.getPublic(), issuerPublicKey, isRoot);
            ContentSigner signer = new JcaContentSignerBuilder(SIGN_ALGORITHM)
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .build(signingKey);
            byte[] certDer = certBuilder.build(signer).getEncoded();
            SecretKey orgKey = orgKeyService.getOrCreateOrgKey(orgId);
            EncryptedData enc = encryptionService.encrypt(keyPair.getPrivate().getEncoded(), orgKey);
            byte[] packedPrivKey = enc.pack();

            Certificate cert = new Certificate();
            cert.setSerialNumber(serial.toString(16));
            cert.setIssuerCertificate(isRoot ? null : issuerCert);
            cert.setOrganizationId(orgId);
            cert.setUserId(targetUser != null ? targetUser.getId() : null);
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
            cert.setExtensions(extensionsToJson(ext));

            return certificateRepository.save(cert);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Certificate generation failed: " + e.getMessage(), e);
        }
    }

    private void validateIssuerChain(Certificate issuerCert) {
        Certificate current = issuerCert;
        int depth = 0;

        while (current != null) {
            if (++depth > 20) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Certificate chain exceeds maximum allowed depth");
            }

            String cn = current.getCommonName();

            if (current.getStatus() == CertificateStatus.REVOKED) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Certificate in chain has been revoked: " + cn);
            }

            LocalDateTime now = LocalDateTime.now();
            if (now.isBefore(current.getNotBefore().truncatedTo(ChronoUnit.MINUTES)) || now.isAfter(current.getNotAfter())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Certificate in chain is outside its validity period: " + cn);
            }

            if (!current.isCACertificate()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Certificate in chain is not a CA certificate: " + cn);
            }

            try {
                X509Certificate x509 = parseX509(current.getCertificateContent());
                Certificate parent = current.getIssuerCertificate();
                PublicKey verifyKey = (parent == null)
                        ? x509.getPublicKey()
                        : parseX509(parent.getCertificateContent()).getPublicKey();
                x509.verify(verifyKey, BouncyCastleProvider.PROVIDER_NAME);
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Certificate in chain has an invalid digital signature: " + cn);
            }

            current = current.getIssuerCertificate();
        }
    }

    private java.security.PrivateKey decryptCertificatePrivateKey(Certificate cert) throws Exception {
        EncryptedData enc = EncryptedData.unpack(cert.getPrivateKeyEncrypted());
        SecretKey orgKey = orgKeyService.getOrCreateOrgKey(cert.getOrganizationId());
        byte[] keyBytes = encryptionService.decrypt(enc, orgKey);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
    }

    private X509Certificate parseX509(byte[] der) throws Exception {
        return (X509Certificate) CertificateFactory.getInstance("X.509")
                .generateCertificate(new ByteArrayInputStream(der));
    }

    private void addExtensions(JcaX509v3CertificateBuilder builder, ExtensionsDto ext, PublicKey subjectKey, PublicKey issuerKey, boolean isRoot) throws Exception {
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

    private ExtensionsDto normalizeExtensions(ExtensionsDto ext, CertificateType certType) {
        return switch (certType) {
            case ROOT, INTERMEDIATE -> new ExtensionsDto(
                true,                                         // isCA forced true
                true,                                         // keyCertSign forced true
                ext.crlSign(),
                ext.digitalSignature(),
                ext.keyEncipherment(),
                ext.dataEncipherment(),
                ext.nonRepudiation(),
                ext.extendedKeyUsages()
            );
            case END_ENTITY -> new ExtensionsDto(
                false,                                        // isCA forced false
                false,                                        // keyCertSign forced false
                false,                                        // crlSign forced false
                ext.digitalSignature(),
                ext.keyEncipherment(),
                ext.dataEncipherment(),
                ext.nonRepudiation(),
                ext.extendedKeyUsages()
            );
        };
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
