package inc.visor.trustanchor.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(name = "location")
    private String location;

    @Column(nullable = false)
    private String email;

    @Column(name = "domain")
    private String website;

    @Column(name = "registration_date", nullable = false)
    private LocalDateTime registrationDate;
}