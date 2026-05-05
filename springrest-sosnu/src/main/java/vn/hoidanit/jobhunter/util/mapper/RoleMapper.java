package vn.hoidanit.JobZone.util.mapper;

import org.mapstruct.Mapper;

import vn.hoidanit.JobZone.domain.dto.RoleDTO;
import vn.hoidanit.JobZone.domain.entity.Role;

@Mapper(componentModel = "spring", uses = { PermissionMapper.class })
public interface RoleMapper {
    RoleDTO toDto(Role role);

    // List<RoleDTO> toDtoList(List<Role> roles);
    // .\bin\windows\kafka-server-start.bat .\config\kraft\server.properties
}
