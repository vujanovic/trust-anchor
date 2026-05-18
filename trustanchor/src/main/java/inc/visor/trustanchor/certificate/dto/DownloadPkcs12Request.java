package inc.visor.trustanchor.certificate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DownloadPkcs12Request(
    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    String password
) {}