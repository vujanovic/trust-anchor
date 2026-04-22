package inc.visor.trustanchor.organization.service;

import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.repository.OrganizationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrganizationService {

    @Autowired
    private final OrganizationRepository organizationRepository;

    public OrganizationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    public List<Organization> findAll() {
        return organizationRepository.findAll();
    }

    public Optional<Organization> findById(Long id) {
        return organizationRepository.findById(id);
    }

    public Organization save(Organization organization) {
        return organizationRepository.save(organization);
    }

    public Organization update(Organization organization) {
        return organizationRepository.save(organization);
    }

}
