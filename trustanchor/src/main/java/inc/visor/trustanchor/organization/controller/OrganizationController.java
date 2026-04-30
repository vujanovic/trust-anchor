package inc.visor.trustanchor.organization.controller;

import inc.visor.trustanchor.exception.NotFoundException;
import inc.visor.trustanchor.organization.dto.CreateOrganizationDto;
import inc.visor.trustanchor.organization.dto.OrganizationDto;
import inc.visor.trustanchor.organization.entity.Organization;
import inc.visor.trustanchor.organization.service.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/org")
public class OrganizationController {

    @Autowired
    OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping()
    public ResponseEntity<List<OrganizationDto>> findOrganizations() {
        return ResponseEntity.ok(organizationService.findAll().stream().map((OrganizationDto::new)).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationDto> findOrganization(@PathVariable Long id) {
        final Organization organization = organizationService.findById(id).orElseThrow(NotFoundException::new);
        return ResponseEntity.ok(new OrganizationDto(organization));
    }

    @PostMapping()
    public ResponseEntity<OrganizationDto> createOrganization(@RequestBody CreateOrganizationDto organizationDto) {
        final Organization organization = organizationService.create(organizationDto);
        return ResponseEntity.ok(new OrganizationDto(organization));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrganizationDto> updateOrganization(@RequestBody OrganizationDto dto, @PathVariable Long id) {
        final Organization organization = organizationService.findById(id).orElseThrow(NotFoundException::new);
        return ResponseEntity.ok(new OrganizationDto(organizationService.update(organization, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>  deleteOrganization(@PathVariable Long id) {
        final Organization organization = organizationService.findById(id).orElseThrow(NotFoundException::new);
        organizationService.delete(organization);
        return ResponseEntity.ok().build();
    }
}
