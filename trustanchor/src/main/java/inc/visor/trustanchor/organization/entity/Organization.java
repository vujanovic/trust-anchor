package inc.visor.trustanchor.organization.entity;

import inc.visor.trustanchor.organization.dto.CreateOrganizationDto;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 64)
    private String code;

    @Column(name = "location")
    private String location;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "domain")
    private String website;

    @Column(name = "registration_date", nullable = false)
    private LocalDateTime registrationDate;

    public Organization() {

    }
}