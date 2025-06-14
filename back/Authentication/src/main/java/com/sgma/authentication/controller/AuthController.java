package com.sgma.authentication.controller;


import com.sgma.authentication.model.ClientLogin;
import com.sgma.authentication.model.RoleMappings;
import com.sgma.authentication.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Log4j2
@CrossOrigin(origins = "http://localhost:4200", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE}, allowCredentials = "true")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody ClientLogin client) {
        try {
            ResponseEntity<Map<String, Object>> responseEntity = authService.login(client);
            if (responseEntity.getStatusCode() == HttpStatus.OK) {
                return ResponseEntity.status(HttpStatus.OK).body(responseEntity.getBody());
            }
        } catch (Exception e) {
            log.error("Login failed for user {}: {}", client.getUsername(), e.getMessage());
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refresh_token");
        ResponseEntity<Map<String, Object>> responseEntity = authService.refresh(refreshToken);
        if (responseEntity.getStatusCode() == HttpStatus.OK) {
            Map<String, String> tokenResponse = responseEntity.getBody().entrySet().stream()
                    .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().toString()));
            return ResponseEntity.ok(tokenResponse);
        }
        log.error("Token refresh failed: {}", responseEntity.getStatusCode());
        return ResponseEntity.status(responseEntity.getStatusCode()).body(null);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody Map<String, String> body,
                                       @RequestHeader("Authorization") String authHeader) {
        String realm = extractRealmFromToken(authHeader.replaceFirst("Bearer ", ""));
        String userId = body.get("userId");
        String token = authHeader.replaceFirst("Bearer ", "");
        authService.logout(realm, userId, token);
        return ResponseEntity.ok().build();
    }

    public String extractRealmFromToken(String accessToken) {
        String[] parts = accessToken.split("\\.");
        if (parts.length < 2) throw new IllegalArgumentException("Invalid JWT");

        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        JSONObject payload = new JSONObject(payloadJson);

        String iss = payload.getString("iss");
        URI issuerUri = URI.create(iss);
        String[] pathSegments = issuerUri.getPath().split("/");
        if (pathSegments.length < 3) throw new IllegalStateException("Unexpected issuer format");

        return pathSegments[2];
    }

    @GetMapping("/realms")
    public ResponseEntity<List<String>> realms(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replaceFirst("Bearer ", "");
        return ResponseEntity.ok(authService.listRealms(token));
    }

    @GetMapping("/realms/{realm}/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers(@RequestHeader("Authorization") String authHeader,
                                                              @PathVariable String realm) {
        String token = authHeader.replaceFirst("Bearer ", "");
        return ResponseEntity.ok(authService.listUsersInRealm(realm, token));
    }

    @GetMapping("/realms/{realm}/users/{userId}/roles")
    public ResponseEntity<RoleMappings> getUserRoles(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String realm,
            @PathVariable String userId) {
        String token = authHeader.replaceFirst("Bearer ", "");
        RoleMappings roles = authService.getUserRoles(realm, userId, token);
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/realms/{realm}/available-roles")
    public ResponseEntity<Map<String, Object>> getAllAvailableRoles(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String realm) {
        String token = authHeader.replace("Bearer ", "");
        Map<String, Object> roles = authService.getAllAvailableRoles(realm, token);
        return ResponseEntity.ok(roles);
    }

    @PostMapping("/realms/{realm}/users/{userId}/roles")
    public ResponseEntity<Void> addRealmRolesToUser(@RequestHeader("Authorization") String authHeader,
                                                    @PathVariable String realm,
                                                    @PathVariable String userId,
                                                    @RequestBody List<Map<String, String>> roles) {
        String token = authHeader.replaceFirst("Bearer ", "");
        authService.addRealmRolesToUser(realm, userId, roles, token);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/realms/{realm}/users/{userId}/roles")
    public ResponseEntity<Void> removeRealmRolesFromUser(@RequestHeader("Authorization") String authHeader,
                                                         @PathVariable String realm,
                                                         @PathVariable String userId,
                                                         @RequestBody List<Map<String, String>> roles) {
        String token = authHeader.replaceFirst("Bearer ", "");
        authService.removeRealmRolesFromUser(realm, userId, roles, token);
        return ResponseEntity.ok().build();
    }

}
