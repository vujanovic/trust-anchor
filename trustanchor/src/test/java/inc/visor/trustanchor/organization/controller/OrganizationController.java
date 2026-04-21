package inc.visor.trustanchor.organization.controller;

import inc.visor.trustanchor.organization.dto.OrganizationDto;
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
    public ResponseEntity<List<OrganizationDto>> getOrganizations() {
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("{id}")
    public ResponseEntity<List<OrganizationDto>> getOrganization() {
        return ResponseEntity.ok(null);
    }

    @PostMapping()
    public ResponseEntity<OrganizationDto> createOrganization(@RequestBody OrganizationDto organizationDto) {
        return ResponseEntity.ok(organizationDto);
    }

    @PutMapping("{id}")
    public ResponseEntity<OrganizationDto> updateOrganization(@RequestBody OrganizationDto organizationDto) {
        return ResponseEntity.ok(organizationDto);
    }
}
