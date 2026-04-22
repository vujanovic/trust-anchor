package inc.visor.trustanchor.organization.repository;


import inc.visor.trustanchor.organization.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    boolean existsByCode(String code);
}
