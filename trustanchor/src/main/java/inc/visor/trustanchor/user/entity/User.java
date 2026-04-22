package inc.visor.trustanchor.user.entity;

import inc.visor.trustanchor.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id", nullable = false)
    private long id;

    @JoinColumn(name = "first_name", nullable = false)
    private String firstName;

    @JoinColumn(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password")
    private String password;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "user_status", nullable = false)
    private UserStatus userStatus;

    @Enumerated(EnumType.ORDINAL)
    @JoinColumn(name = "user_role_id", nullable = false)
    private UserRole userRole;
}
