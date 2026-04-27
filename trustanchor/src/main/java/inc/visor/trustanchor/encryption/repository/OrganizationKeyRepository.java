package inc.visor.trustanchor.encryption.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import inc.visor.trustanchor.encryption.entity.OrganizationKey;

public interface OrganizationKeyRepository extends JpaRepository<OrganizationKey, Long> {
    Optional<OrganizationKey> findFirstByOrganizationIdAndIsActiveTrueOrderByCreatedAtDesc(long organizationId);    
}
