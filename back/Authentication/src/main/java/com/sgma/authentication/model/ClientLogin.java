package com.sgma.authentication.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientLogin {

    private String username;
    private String password;
    private String grant_type = "password";
}