package com.sgma.authentication.client;

import com.sgma.authentication.model.TokenResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "keycloak-client", url = "${keycloak.auth-server-url}")
public interface KeycloakClient {

    @PostMapping(value = "/realms/master/protocol/openid-connect/token",
            consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    TokenResponse getRefreshToken(
            @RequestParam("grant_type") String grantType,
            @RequestParam("client_id") String clientId,
            @RequestParam("client_secret") String clientSecret,
            @RequestParam("refresh_token") String refreshToken
    );

    @GetMapping("/admin/realms")
    List<Map<String, Object>> listRealms(@RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @GetMapping("/admin/realms/{realm}/users")
    List<Map<String, Object>> listUsers(@PathVariable String realm,
                                        @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @PostMapping("/admin/realms/{realm}/users/{userId}/role-mappings/realm")
    void addRolesToUser(@PathVariable String realm,
                        @PathVariable String userId,
                        @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken,
                        @RequestBody List<Map<String, String>> roles);

    @DeleteMapping("/admin/realms/{realm}/users/{userId}/role-mappings/realm")
    void removeRolesFromUser(@PathVariable String realm,
                             @PathVariable String userId,
                             @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken,
                             @RequestBody List<Map<String, String>> roles);

    @PostMapping("/admin/realms/{realm}/users/{userId}/logout")
    void logout(@PathVariable String realm,
                @PathVariable String userId,
                @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);
}
