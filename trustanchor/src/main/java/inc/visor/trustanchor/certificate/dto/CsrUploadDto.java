package inc.visor.trustanchor.certificate.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;

@Data
public class CsrUploadDto {

    @NotNull
    private Long issuerId;
    @NotNull
    private MultipartFile csrFile;
    @NotNull
    private LocalDate validFrom;
    @NotNull
    private LocalDate validTo;

}