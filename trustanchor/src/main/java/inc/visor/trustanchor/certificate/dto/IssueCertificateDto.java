package inc.visor.trustanchor.certificate.dto;

import java.time.LocalDateTime;

import inc.visor.trustanchor.certificate.enums.CertificateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class IssueCertificateDto {
    @NotNull Long issuerCertificateId;
    @NotNull CertificateType certificateType;   // INTERMEDIATE or END_ENTITY only for CA_USER
    @NotBlank String commonName;
    @NotBlank String organizationName;
    String organizationalUnit;
    @NotBlank @Size(min=2, max=2) String country;
    String email;
    @NotNull LocalDateTime notBefore;
    @NotNull LocalDateTime notAfter;
    @NotNull ExtensionsDto extensions;


}