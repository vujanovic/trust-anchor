package inc.visor.trustanchor.certificate.service;

import inc.visor.trustanchor.certificate.dto.CertificateDto;
import inc.visor.trustanchor.certificate.entity.Certificate;
import inc.visor.trustanchor.certificate.repository.CertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateService {

    private final CertificateRepository certificateRepository;

    public List<Certificate> getUserCertificates(Long userId) {
        return certificateRepository.findByUserId(userId);
    }

    public Certificate getCertificate(Long id) {
        return certificateRepository.findById(id).orElse(null);
    }

    public Certificate saveCertificate(Certificate certificate) {
        return certificateRepository.save(certificate);
    }

}