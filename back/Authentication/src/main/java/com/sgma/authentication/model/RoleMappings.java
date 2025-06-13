package com.sgma.authentication.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RoleMappings {
    private List<Role> realmMappings;
    private Map<String, ClientRoleMapping> clientMappings;
}

