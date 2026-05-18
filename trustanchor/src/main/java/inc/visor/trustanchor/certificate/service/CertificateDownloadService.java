package inc.visor.trustanchor.certificate.service;

import java.io.ByteArrayOutputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.List;

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
            throw new IllegalStateException("Private key has already been downloaded for this certificate");
        }

        PrivateKey privateKey = certificateService.decryptCertificatePrivateKey(cert);

        List<X509Certificate> certChain = certificateService.buildCertificateChain(cert);

        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        keyStore.load(null, null);
        keyStore.setKeyEntry(cert.getCommonName(),
                privateKey,
                password.toCharArray(),
                certChain.toArray(new X509Certificate[0]));
        
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        keyStore.store(baos, password.toCharArray());

        // Mark as downloaded atomically within same transaction
        cert.setPrivateKeyDownloaded(true);
        certificateService.save(cert);

        return baos.toByteArray();
    }

    
}
