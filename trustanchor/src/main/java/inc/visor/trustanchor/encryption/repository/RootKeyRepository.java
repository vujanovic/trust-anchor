package inc.visor.trustanchor.encryption.repository;

import inc.visor.trustanchor.encryption.entity.RootKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RootKeyRepository extends JpaRepository<RootKey, Long> {


    Optional<RootKey> findByIsActiveTrue();
    Optional<RootKey> findByMasterKeyVersion(int masterKeyVersion);
    Optional<RootKey> findByMasterKeyVersionAndIsActiveTrue(int masterKeyVersion);
    boolean existsByIsActiveTrue();

}