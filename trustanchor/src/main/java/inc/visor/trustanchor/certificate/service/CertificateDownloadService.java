package inc.visor.trustanchor.certificate.service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.List;

import org.bouncycastle.openssl.jcajce.JcaPEMWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.user.entity.AnchorUserDetails;


@Service
public class CertificateDownloadService {
    private final CertificateService certificateService;
    
    public CertificateDownloadService(CertificateService certificateService) {
        this.certificateService = certificateService;
    }
    

    @Transactional
    public byte[] downloadPkcs12(Long certId, String password, AnchorUserDetails user) throws Exception {
        Certificate cert = certificateService.authorizeAndFetch(certId, user);

        if (cert.getPrivateKeyEncrypted() == null) {
            throw new IllegalStateException("Certificate does not have an associated private key");
        }

        if (cert.getPrivateKeyDownloaded()) {
            throw new IllegalStateException("CSR was used for generating this certificate. Private key was already downloaded.");
        }

        PrivateKey privateKey = certificateService.decryptCertificatePrivateKey(cert);

        List<X509Certificate> certChain = certificateService.buildCertificateChain(cert);

        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        keyStore.load(null, null);
        keyStore.setKeyEntry(cert.getCommonName(),
                privateKey,
                password.toCharArray(),
                certChain.toArray(X509Certificate[]::new));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        keyStore.store(baos, password.toCharArray());

        return baos.toByteArray();
    }

    public byte[] bundlePrivateKeyWithCertIntoPkcs12S(Certificate cert, PrivateKey privateKey, String password) throws Exception {

        List<X509Certificate> certChain = certificateService.buildCertificateChain(cert);

        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        keyStore.load(null, null);
        keyStore.setKeyEntry(cert.getCommonName(),
                privateKey,
                password.toCharArray(),
                certChain.toArray(X509Certificate[]::new));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        keyStore.store(baos, password.toCharArray());

        return baos.toByteArray();
    }

    public byte[] downloadPem(Long certId, AnchorUserDetails user) throws Exception {
        Certificate cert = certificateService.authorizeAndFetch(certId, user);
        List<X509Certificate> certChain = certificateService.buildCertificateChain(cert);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             JcaPEMWriter pemWriter = new JcaPEMWriter(new OutputStreamWriter(baos))) {

            for (X509Certificate certificate : certChain) {
                pemWriter.writeObject(certificate);
            }

            pemWriter.flush();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("cant build chain when downloading as pem", e);
        }
    }

    public byte[] downloadCer(Long certId, AnchorUserDetails user) throws Exception {
        Certificate cert = certificateService.authorizeAndFetch(certId, user);
        return cert.getCertificateContent();
    }

    
}
