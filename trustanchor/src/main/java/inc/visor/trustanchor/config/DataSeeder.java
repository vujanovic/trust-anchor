package inc.visor.trustanchor.config;

import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.Security;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import javax.crypto.SecretKey;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.X500NameBuilder;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.bouncycastle.asn1.x509.BasicConstraints;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.KeyUsage;
import org.bouncycastle.cert.jcajce.JcaX509ExtensionUtils;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.enums.CertificateStatus;
import inc.visor.trustanchor.certificate.enums.CertificateType;
import inc.visor.trustanchor.certificate.repository.CertificateRepository;
import inc.visor.trustanchor.encryption.dto.EncryptedData;
import inc.visor.trustanchor.encryption.service.EncryptionService;
import inc.visor.trustanchor.encryption.service.OrganizationKeyService;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.repository.OrganizationRepository;
import inc.visor.trustanchor.user.entity.User;
import inc.visor.trustanchor.user.entity.UserRole;
import inc.visor.trustanchor.user.entity.UserStatus;
import inc.visor.trustanchor.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final int KEY_SIZE = 2048;

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CertificateRepository certificateRepository;
    private final EncryptionService encryptionService;
    private final OrganizationKeyService orgKeyService;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) return; // already seeded

        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        Organization org = organizationRepository.save(
            Organization.builder()
                .name("TrustAnchor Root")
                .code("TRUSTANCHOR")
                .email("root@trustanchor.local")
                .domain("trustanchor.local")
                .location("Belgrade, Serbia")
                .registrationDate(LocalDateTime.now().toLocalDate().atStartOfDay())
                .build()
        );

        userRepository.save(User.builder()
            .firstName("Admin")
            .lastName("TrustAnchor")
            .email("admin@gmail.com")
            .password(passwordEncoder.encode("TestPassword123!"))
            .organization(org)
            .userRole(UserRole.ADMIN)
            .userStatus(UserStatus.ACTIVE)
            .build()
        );

        userRepository.save(User.builder()
            .firstName("CA")
            .lastName("User")
            .email("ca@gmail.com")
            .password(passwordEncoder.encode("TestPassword123!"))
            .organization(org)
            .userRole(UserRole.CA_USER)
            .userStatus(UserStatus.ACTIVE)
            .build()
        );

        userRepository.save(User.builder()
            .firstName("Regular")
            .lastName("User")
            .email("user@gmail.com")
            .password(passwordEncoder.encode("TestPassword123!"))
            .organization(org)
            .userRole(UserRole.USER)
            .userStatus(UserStatus.ACTIVE)
            .build()
        );

        userRepository.save(User.builder()
                .firstName("Regular 2")
                .lastName("User 2")
                .email("user2@gmail.com")
                .password(passwordEncoder.encode("TestPassword123!"))
                .organization(org)
                .userRole(UserRole.USER)
                .userStatus(UserStatus.ACTIVE)
                .build()
        );

        seedRootCertificate(org);
    }

    private void seedRootCertificate(Organization org) throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA", BouncyCastleProvider.PROVIDER_NAME);
        gen.initialize(KEY_SIZE, new SecureRandom());
        KeyPair keyPair = gen.generateKeyPair();

        X500Name dn = new X500NameBuilder(BCStyle.INSTANCE)
            .addRDN(BCStyle.CN, "TrustAnchor Root CA")
            .addRDN(BCStyle.O, "TrustAnchor")
            .addRDN(BCStyle.C, "RS")
            .build();

        BigInteger serial = new BigInteger(128, new SecureRandom()).abs();
        LocalDateTime notBefore = LocalDateTime.now();
        LocalDateTime notAfter = notBefore.plusYears(10);

        Date from = Date.from(notBefore.atZone(ZoneId.systemDefault()).toInstant());
        Date to   = Date.from(notAfter.atZone(ZoneId.systemDefault()).toInstant());

        JcaX509v3CertificateBuilder builder = new JcaX509v3CertificateBuilder(
            dn, serial, from, to, dn, keyPair.getPublic()
        );

        JcaX509ExtensionUtils utils = new JcaX509ExtensionUtils();
        builder.addExtension(Extension.subjectKeyIdentifier, false,
            utils.createSubjectKeyIdentifier(keyPair.getPublic()));
        builder.addExtension(Extension.basicConstraints, true,
            new BasicConstraints(true));
        builder.addExtension(Extension.keyUsage, true,
            new KeyUsage(KeyUsage.keyCertSign | KeyUsage.cRLSign | KeyUsage.digitalSignature));

        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
            .setProvider(BouncyCastleProvider.PROVIDER_NAME)
            .build(keyPair.getPrivate());
        byte[] certDer = builder.build(signer).getEncoded();

        SecretKey orgKey = orgKeyService.getOrCreateOrgKey(org.getId());
        EncryptedData enc = encryptionService.encrypt(keyPair.getPrivate().getEncoded(), orgKey);
        byte[] packedKey = enc.pack();

        Certificate cert = new Certificate();
        cert.setSerialNumber(serial.toString(16));
        cert.setOrganizationId(org.getId());
        cert.setCommonName("TrustAnchor Root CA");
        cert.setOrganizationName("TrustAnchor");
        cert.setCountry("RS");
        cert.setCertificateType(CertificateType.ROOT);
        cert.setNotBefore(notBefore);
        cert.setNotAfter(notAfter);
        cert.setCertificateContent(certDer);
        cert.setPublicKey(keyPair.getPublic().getEncoded());
        cert.setPrivateKeyEncrypted(packedKey);
        cert.setStatus(CertificateStatus.ACTIVE);
        cert.setExtensions("{\"isCA\":true,\"keyCertSign\":true,\"crlSign\":true,\"digitalSignature\":true}");

        certificateRepository.save(cert);
    }

}
