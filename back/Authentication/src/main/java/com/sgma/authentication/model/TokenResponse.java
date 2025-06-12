package com.sgma.authentication.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class TokenResponse {
    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("expires_in")
    private int expiresIn;

    @JsonProperty("refresh_expires_in")
    private int refreshExpiresIn;

    @JsonProperty("token_type")
    private String tokenType;

    private String scope;

    public Map<String, String> toMap() {
        Map<String, String> map = new HashMap<>();
        if (accessToken != null) map.put("access_token", accessToken);
        if (refreshToken != null) map.put("refresh_token", refreshToken);
        map.put("expires_in", String.valueOf(expiresIn));
        map.put("refresh_expires_in", String.valueOf(refreshExpiresIn));
        if (tokenType != null) map.put("token_type", tokenType);
        if (scope != null) map.put("scope", scope);
        return map;
    }
}
