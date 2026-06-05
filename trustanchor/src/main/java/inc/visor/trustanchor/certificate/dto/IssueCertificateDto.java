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
    Long issuerCertificateId;
    @NotNull CertificateType certificateType;
    @NotBlank String commonName;
    @NotBlank String organizationName;
    String organizationalUnit;
    @NotBlank @Size(min=2, max=2) String country;
    String email;
    @NotNull LocalDateTime notBefore;
    @NotNull LocalDateTime notAfter;
    ExtensionsDto extensions;

    public IssueCertificateDto(CertificateRequestDto dto) {
        this.setCertificateType(CertificateType.END_ENTITY);
        this.setIssuerCertificateId(dto.getIssuerId());
        this.setCommonName(dto.getCommonName());
        this.setEmail(dto.getEmail());
        this.setCountry(dto.getCountry());
        this.setNotBefore(dto.getValidFrom().atStartOfDay());
        this.setNotAfter(dto.getValidTo().atStartOfDay());
        this.setOrganizationalUnit(dto.getOrganizationalUnit());
        this.setOrganizationName(dto.getOrganization());
        this.setExtensions(dto.getExtensions());
    }
}