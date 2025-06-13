package com.sgma.authentication.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RoleRepresentation {
    private String id;
    private String name;
    private boolean clientRole;
    private boolean composite;

    @JsonIgnore
    private String type;

}
