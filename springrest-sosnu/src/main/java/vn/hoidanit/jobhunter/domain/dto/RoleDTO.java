package vn.hoidanit.JobZone.domain.dto;

import java.time.Instant;
import java.util.List;

import lombok.Data;

@Data
public class RoleDTO {
    private long id;

    private String name;

    private String description;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    private List<PermissionDTO> permissions;

}
