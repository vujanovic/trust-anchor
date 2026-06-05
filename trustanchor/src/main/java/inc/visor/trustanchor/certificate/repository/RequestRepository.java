package inc.visor.trustanchor.certificate.repository;

import inc.visor.trustanchor.certificate.dto.CsrStatus;
import inc.visor.trustanchor.certificate.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RequestRepository extends JpaRepository<Request, Long> {

    @Query("SELECT r FROM Request r " +
            "JOIN Certificate c ON r.issuerId = c.id " +
            "WHERE r.csrStatus = :status AND (" +
            "  c.userId = :caId " +
            "  OR c.certificateType = inc.visor.trustanchor.certificate.enums.CertificateType.ROOT" +
            ")")
    List<Request> findActiveRequestsByCa(
            @Param("status") CsrStatus status,
            @Param("caId") long caId
    );
}
