package inc.visor.trustanchor.organization.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "organizations")
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