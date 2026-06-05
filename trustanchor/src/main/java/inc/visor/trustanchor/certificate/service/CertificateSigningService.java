package inc.visor.trustanchor.certificate.service;
import org.bouncycastle.asn1.pkcs.CertificationRequest;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509ExtensionUtils;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentVerifierProviderBuilder;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.pkcs.PKCS10CertificationRequest;
import org.bouncycastle.pkcs.jcajce.JcaPKCS10CertificationRequest;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.math.BigInteger;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

@Service
public class CertificateSigningService {


    public PKCS10CertificationRequest parseCsrBytes(byte[] csrBytes) throws Exception {
        try (PEMParser pemParser = new PEMParser(new InputStreamReader(new ByteArrayInputStream(csrBytes)))) {
            Object parsedObject = pemParser.readObject();

            if (parsedObject instanceof PKCS10CertificationRequest) {
                return (PKCS10CertificationRequest) parsedObject;
            } else if (parsedObject instanceof CertificationRequest) {
                return new PKCS10CertificationRequest((CertificationRequest) parsedObject);
            }

            throw new IllegalArgumentException("Provided byte array does not contain a valid valid PKCS#10 CSR structure.");
        }
    }

    public X509Certificate signUploadedCsr(byte[] rawCsrBytes,
                                           X509Certificate issuerCert,
                                           PrivateKey issuerPrivateKey,
                                           LocalDate notBefore,
                                           LocalDate notAfter) throws Exception {

        PKCS10CertificationRequest csr = parseCsrBytes(rawCsrBytes);

        JcaPKCS10CertificationRequest jcaCsr = new JcaPKCS10CertificationRequest(csr);
        PublicKey publicKey = jcaCsr.getPublicKey();

        if (!jcaCsr.isSignatureValid(new JcaContentVerifierProviderBuilder().setProvider("BC").build(publicKey))) {
            throw new SecurityException("CSR internal signature validation failed.");
        }

        Date fromDate = Date.from(notBefore.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date toDate = Date.from(notAfter.atStartOfDay(ZoneId.systemDefault()).toInstant());

        BigInteger serialNumber = new BigInteger(128, new SecureRandom()).abs();

        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                issuerCert,
                serialNumber,
                fromDate,
                toDate,
                csr.getSubject(),
                publicKey
        );

        JcaX509ExtensionUtils extUtils = new JcaX509ExtensionUtils();
        certBuilder.addExtension(org.bouncycastle.asn1.x509.Extension.subjectKeyIdentifier, false, extUtils.createSubjectKeyIdentifier(publicKey));
        certBuilder.addExtension(org.bouncycastle.asn1.x509.Extension.authorityKeyIdentifier, false, extUtils.createAuthorityKeyIdentifier(issuerCert));

        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA").setProvider("BC").build(issuerPrivateKey);

        return new JcaX509CertificateConverter()
                .setProvider("BC")
                .getCertificate(certBuilder.build(signer));
    }
}
