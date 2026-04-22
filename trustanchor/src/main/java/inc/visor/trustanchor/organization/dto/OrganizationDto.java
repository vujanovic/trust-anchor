package inc.visor.trustanchor.organization.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import inc.visor.trustanchor.organization.entity.Organization;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OrganizationDto {

    private Long id;

    @NotBlank(message = "Organization name is required")
    @Size(max = 255, message = "Name is too long")
    private String name;

    @NotBlank(message = "Organization code is required")
    @Size(min = 2, max = 64, message = "Code must be between 2 and 64 characters")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Code must be uppercase alphanumeric")
    private String code;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Domain is required")
    @Pattern(regexp = "^(?!://)([a-zA-Z0-9-_]+\\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\\.[a-zA-Z]{2,11}?$",
            message = "Invalid domain format")
    private String website;

    @NotNull(message = "Registration date is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    @PastOrPresent(message = "Registration date cannot be in the future")
    private LocalDateTime registrationDate;

    public OrganizationDto(Organization organization) {
        this.id = organization.getId();
        this.name = organization.getName();
        this.code = organization.getCode();
        this.location = organization.getLocation();
        this.email = organization.getEmail();
        this.website = organization.getWebsite();
        this.registrationDate = organization.getRegistrationDate();
    }
}