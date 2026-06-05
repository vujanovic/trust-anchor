package inc.visor.trustanchor.certificate.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class CsrDashboardResponse {
    private Long id;
    private Long issuerId;
    private LocalDate notBefore;
    private LocalDate notAfter;
    private String csrStatus;
    private String commonName;
    private String email;
    private String organization;
}
