package inc.visor.trustanchor.organization.service;

import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.organization.dto.CreateOrganizationDto;
import inc.visor.trustanchor.organization.dto.OrganizationDto;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.repository.OrganizationRepository;
import org.apache.coyote.BadRequestException;
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

    public Organization create(CreateOrganizationDto dto) {
        if (organizationRepository.existsByCode(dto.getCode())) {
            throw new NotFoundException();
        }
        Organization organization = Organization.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .location(dto.getLocation())
                .email(dto.getEmail())
                .website(dto.getWebsite())
                .registrationDate(dto.getRegistrationDate())
                .build();
        return organizationRepository.save(organization);
    }

    public Organization update(Organization organization, OrganizationDto dto) {
        organization.setRegistrationDate(dto.getRegistrationDate());
        organization.setName(dto.getName());
        organization.setLocation(dto.getLocation());
        organization.setEmail(dto.getEmail());
        organization.setWebsite(dto.getWebsite());
        return organizationRepository.save(organization);
    }

    public void delete(Organization organization) {
        organizationRepository.delete(organization);
    }
}
