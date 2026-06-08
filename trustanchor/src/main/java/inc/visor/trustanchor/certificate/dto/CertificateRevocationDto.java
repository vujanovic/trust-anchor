package inc.visor.trustanchor.certificate.dto;

import inc.visor.trustanchor.certificate.enums.RevocationReason;
import lombok.Data;
import lombok.NonNull;

@Data
public class CertificateRevocationDto {
    long certificateId;
    @NonNull
    RevocationReason revocationReason;
}
