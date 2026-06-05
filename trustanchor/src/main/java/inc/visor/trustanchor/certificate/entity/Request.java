package inc.visor.trustanchor.certificate.entity;

import inc.visor.trustanchor.certificate.dto.CsrStatus;
import inc.visor.trustanchor.certificate.dto.CsrUploadDto;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "requests")
public class Request {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "issuer_id")
    private Long issuerId;

    @NotNull
    @Column(name = "csr_file")
    private byte[] csrFile;

    @NotNull
    @Column(name = "not_before")
    private LocalDate notBefore;

    @Column(name = "not_after")
    @NotNull
    private LocalDate notAfter;

    @Column(name = "csr_status")
    @NotNull
    private CsrStatus csrStatus = CsrStatus.PENDING;

    @Column(name = "user_id")
    @NotNull
    private Long userId;


    public Request(CsrUploadDto dto) throws IOException {
        this.csrFile = dto.getCsrFile().getBytes();
        this.notBefore = dto.getValidFrom();
        this.notAfter = dto.getValidTo();
        this.issuerId = dto.getIssuerId();
    }

    public Request() {

    }
}
