package inc.visor.trustanchor.certificate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CertificateRequestDto {
    @NotNull
    private Long issuerId;
    @NotBlank
    @NotNull
    private String csrMethod;
    @NotBlank
    private String commonName;
    @NotBlank
    private String email;
    @NotBlank
    private String organization;
    @NotBlank
    private String organizationalUnit;
    @NotBlank
    private String country;
    @NotNull
    private LocalDate validFrom;
    @NotNull
    private LocalDate validTo;
    @NotBlank
    @NotNull
    private String password;
    @NotNull
    private ExtensionsDto extensions;
}
