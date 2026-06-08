package inc.visor.trustanchor.certificate.controller;

import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.service.CertificateService;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509CRLHolder;
import org.bouncycastle.cert.X509v2CRLBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CRLConverter;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigInteger;
import java.security.PrivateKey;
import java.security.cert.X509CRL;
import java.security.cert.X509Certificate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("api/v1/crl")
public class CrlController {

    CertificateService certificateService;

    @Autowired
    public CrlController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    public ResponseEntity<byte[]> getCRL() {
        try {
            X509Certificate caCert = certificateService.getRootCaCertificate();
            PrivateKey caPrivateKey = certificateService.getRootCaPrivateKey();
            X500Name issuer = new X500Name(caCert.getIssuerX500Principal().getName());
            X509v2CRLBuilder crlBuilder = new X509v2CRLBuilder(issuer, new Date()); // current time
            crlBuilder.setNextUpdate(new Date(System.currentTimeMillis() + (7L * 24 * 60 * 60 * 1000)));
            List<Certificate> revokedCertificates = certificateService.getAllRevokedCertificates();
            for (Certificate certificate : revokedCertificates) {
                int reasonCode = certificate.getRevocationReason().ordinal();
                crlBuilder.addCRLEntry(new BigInteger(certificate.getSerialNumber()), Date.from(certificate.getRevokedAt().atZone(ZoneId.systemDefault()).toInstant()), reasonCode);
            }
            ContentSigner signer = new JcaContentSignerBuilder("SHA256WithRSAEncryption").setProvider("BC").build(caPrivateKey);
            X509CRLHolder crlHolder = crlBuilder.build(signer);
            X509CRL crl = new JcaX509CRLConverter().setProvider("BC").getCRL(crlHolder);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/pkix-crl"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"trustanchor.crl\"")
                    .body(crl.getEncoded());

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
