package inc.visor.trustanchor.certificate.service;

import org.springframework.stereotype.Service;

import inc.visor.trustanchor.encryption.service.OrganizationKeyService;
import inc.visor.trustanchor.user.service.UserService;

@Service
public class CertificateDownloadService {
    private final CertificateService certificateService;
    private final OrganizationKeyService orgKeyService;
    private final UserService userService;

    public CertificateDownloadService(CertificateService certificateService, OrganizationKeyService orgKeyService, UserService userService) {
        this.certificateService = certificateService;
        this.orgKeyService = orgKeyService;
        this.userService = userService;
    }
    
}
