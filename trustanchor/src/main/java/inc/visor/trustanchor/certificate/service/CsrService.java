package inc.visor.trustanchor.certificate.service;

import inc.visor.trustanchor.certificate.dto.CsrDashboardResponse;
import inc.visor.trustanchor.certificate.dto.CsrStatus;
import inc.visor.trustanchor.certificate.entity.Request;
import inc.visor.trustanchor.certificate.repository.RequestRepository;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.bouncycastle.asn1.x500.style.IETFUtils;
import org.bouncycastle.pkcs.PKCS10CertificationRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CsrService {
    private final RequestRepository requestRepository;
    private final CertificateSigningService certificateSigningService;

    public CsrService(RequestRepository requestRepository, CertificateSigningService certificateSigningService) {
        this.requestRepository = requestRepository;
        this.certificateSigningService = certificateSigningService;
    }

    public Optional<Request> getCsr(long id) {
        return requestRepository.findById(id);
    }

    public Request saveCsr(Request request) {
        return requestRepository.save(request);
    }

    public void deleteCsr(long id) {
        requestRepository.deleteById(id);
    }

    public Request approveCsr(Request request) {
        request.setCsrStatus(CsrStatus.APPROVED);
        return requestRepository.save(request);
    }

    public Request rejectCsr(Request request) {
        request.setCsrStatus(CsrStatus.REJECTED);
        return requestRepository.save(request);
    }

    public Optional<Request> approveById(long id) {
        Optional<Request> request = requestRepository.findById(id);
        if (request.isPresent()) {
            request.get().setCsrStatus(CsrStatus.APPROVED);
            return Optional.of(requestRepository.save(request.get()));
        }
        return Optional.empty();
    }

    public Optional<Request> rejectById(long id) {
        Optional<Request> request = requestRepository.findById(id);
        if (request.isPresent()) {
            request.get().setCsrStatus(CsrStatus.REJECTED);
            return Optional.of(requestRepository.save(request.get()));
        }
        return Optional.empty();
    }

    public List<Request> findActiveByCa(long caUserId) {
        return requestRepository.findActiveRequestsByCa(CsrStatus.PENDING, caUserId);
    }

    public List<CsrDashboardResponse> getDashboardRequestsForCa(long caUserId) {
        List<Request> rawRequests = findActiveByCa(caUserId);

        return rawRequests.stream().map(req -> {
            String commonName = "Unknown";
            String email = "Unknown";
            String organization = "Unknown";

            try {
                PKCS10CertificationRequest parsedCsr = certificateSigningService.parseCsrBytes(req.getCsrFile());
                X500Name subject = parsedCsr.getSubject();

                if (subject.getRDNs(BCStyle.CN).length > 0) {
                    commonName = IETFUtils.valueToString(subject.getRDNs(BCStyle.CN)[0].getFirst().getValue());
                }
                if (subject.getRDNs(BCStyle.EmailAddress).length > 0) {
                    email = IETFUtils.valueToString(subject.getRDNs(BCStyle.EmailAddress)[0].getFirst().getValue());
                }
                if (subject.getRDNs(BCStyle.O).length > 0) {
                    organization = IETFUtils.valueToString(subject.getRDNs(BCStyle.O)[0].getFirst().getValue());
                }
            } catch (Exception e) {
                commonName = "Malformed CSR File Data";
            }

            return CsrDashboardResponse.builder()
                    .id(req.getId())
                    .issuerId(req.getIssuerId())
                    .notBefore(req.getNotBefore())
                    .notAfter(req.getNotAfter())
                    .csrStatus(req.getCsrStatus().name())
                    .commonName(commonName)
                    .email(email)
                    .organization(organization)
                    .build();
        }).collect(Collectors.toList());
    }



}
