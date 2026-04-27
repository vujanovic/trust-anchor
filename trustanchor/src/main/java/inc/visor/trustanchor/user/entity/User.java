package inc.visor.trustanchor.user.entity;

import inc.visor.trustanchor.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@Entity
@Table(name = "users")
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id", nullable = false)
    private long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password")
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "user_status", nullable = false)
    private UserStatus userStatus;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "user_role", nullable = false)
    private UserRole userRole;
}
