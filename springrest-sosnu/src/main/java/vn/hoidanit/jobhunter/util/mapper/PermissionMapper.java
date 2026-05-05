package vn.hoidanit.JobZone.util.mapper;

import org.mapstruct.Mapper;

import vn.hoidanit.jobhunter.domain.dto.PermissionDTO;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    PermissionDTO toDto(Permission permission);

    // List<PermissionDTO> toDto(List<Permission> permission);

}