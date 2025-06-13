package com.sgma.authentication.client;

import com.sgma.authentication.model.RoleMappings;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "keycloak-client", url = "${keycloak.auth-server-url}")
public interface KeycloakClient {

    @GetMapping("/admin/realms")
    List<Map<String, Object>> listRealms(@RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @GetMapping("/admin/realms/{realm}/users")
    List<Map<String, Object>> listUsers(@PathVariable String realm,
                                        @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @GetMapping("/admin/realms/{realm}/users/{userId}/role-mappings")
    RoleMappings getUserRoles(@PathVariable String realm,
                              @PathVariable String userId,
                              @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @PostMapping("/admin/realms/{realm}/users/{userId}/logout")
    void logout(@PathVariable String realm,
                @PathVariable String userId,
                @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @GetMapping("/admin/realms/{realm}/roles")
        List<Map<String, String>> getAllRolesInRealm(@PathVariable String realm,
                                                 @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @GetMapping("/admin/realms/{realm}/clients")
    List<Map<String, Object>> listClients(@PathVariable String realm,
                                          @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @GetMapping("/admin/realms/{realm}/roles")
    List<Map<String, String>> getAvailableRoles(@PathVariable String realm,
                                                 @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @GetMapping("/admin/realms/{realm}/clients/{clientId}/roles")
    List<Map<String, String>> getClientRoles(@PathVariable String realm,
                                              @PathVariable String clientId,
                                              @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);

    @PostMapping("/admin/realms/{realm}/users/{userId}/role-mappings/realm")
    void addRealmRolesToUser(@PathVariable String realm,
                             @PathVariable String userId,
                             @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken,
                             @RequestBody List<Map<String, String>> roles);

    @DeleteMapping("/admin/realms/{realm}/users/{userId}/role-mappings/realm")
    void removeRealmRolesFromUser(@PathVariable String realm,
                                  @PathVariable String userId,
                                  @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken,
                                  @RequestBody List<Map<String, String>> roles);

    @PostMapping("/admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientId}")
    void addClientRolesToUser(@PathVariable String realm,
                              @PathVariable String userId,
                              @PathVariable String clientId,
                              @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken,
                              @RequestBody List<Map<String, String>> roles);

    @DeleteMapping("/admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientId}")
    void removeClientRolesFromUser(@PathVariable String realm,
                                   @PathVariable String userId,
                                   @PathVariable String clientId,
                                   @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken,
                                   @RequestBody List<Map<String, String>> roles);

    @GetMapping("/admin/realms/{realm}/clients?clientId={clientName}")
    String getClientIdByName(@PathVariable String realm,
                             @RequestParam("clientId") String clientName,
                             @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);
}
