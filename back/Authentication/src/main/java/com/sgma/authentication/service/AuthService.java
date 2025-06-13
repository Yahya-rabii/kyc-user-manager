package com.sgma.authentication.service;

import com.sgma.authentication.client.KeycloakClient;
import com.sgma.authentication.model.ClientLogin;
import com.sgma.authentication.model.RoleMappings;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final String TRACE_ID = "traceId";

    private final KeycloakClient keycloakClient;

    @Value("${keycloak.client-id}") private String clientId;
    @Value("${keycloak.client-secret}") private String clientSecret;
    @Value("${keycloak.token-url}") private String tokenUrl;

    private void addTraceId() {
        MDC.put(TRACE_ID, UUID.randomUUID().toString());
    }

    private void clearTrace() {
        MDC.clear();
    }

    /**
     * Logs in a user to Keycloak using the provided credentials.
     *
     * @param client The client login details containing username, password, and grant type.
     * @return A ResponseEntity containing the access token and other details.
     */
    public ResponseEntity<Map<String, Object>> login(ClientLogin client) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
        requestBody.add("grant_type", client.getGrant_type());
        requestBody.add("client_id", clientId);
        requestBody.add("client_secret", clientSecret);
        requestBody.add("username", client.getUsername());
        requestBody.add("password", client.getPassword());
        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);
        return restTemplate.exchange(tokenUrl, HttpMethod.POST, requestEntity, new ParameterizedTypeReference<>() {});
    }

    /**
     * Refreshes the access token using the provided refresh token.
     *
     * @param refreshToken The refresh token to use for obtaining a new access token.
     * @return A ResponseEntity containing the new access token and other details.
     */
    public  ResponseEntity<Map<String, Object>> refresh(String refreshToken) {
        addTraceId();
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
            requestBody.add("grant_type", "refresh_token");
            requestBody.add("client_id", clientId);
            requestBody.add("client_secret", clientSecret);
            requestBody.add("refresh_token", refreshToken);
            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);
            return restTemplate.exchange(tokenUrl, HttpMethod.POST, requestEntity, new ParameterizedTypeReference<>() {});
        } finally {
            clearTrace();
        }
    }

    /**
     * Logs out a user from Keycloak.
     *
     * @param realm The name of the realm.
     * @param userId The ID of the user.
     * @param accessToken The access token for authentication.
     */
    public void logout(String realm, String userId, String accessToken) {
        addTraceId();
        try {
            keycloakClient.logout(realm, userId, "Bearer " + accessToken);
        } finally {
            clearTrace();
        }
    }

    /**
     * Lists all realms available in Keycloak.
     *
     * @param accessToken The access token for authentication.
     * @return A list of realm names.
     */
    public List<String> listRealms(String accessToken) {
        addTraceId();
        try {
            List<Map<String, Object>> realms = keycloakClient.listRealms("Bearer " + accessToken);
            return realms.stream()
                    .map(r -> (String) r.get("realm"))
                    .collect(Collectors.toList());
        } finally {
            clearTrace();
        }
    }

    /**
     * Lists all users in a specific realm.
     *
     * @param realm The name of the realm.
     * @param accessToken The access token for authentication.
     * @return A list of users in the specified realm.
     */
    public List<Map<String, Object>> listUsersInRealm(String realm, String accessToken) {
        addTraceId();
        try {
            return keycloakClient.listUsers(realm, "Bearer " + accessToken);
        } finally {
            clearTrace();
        }
    }

    /**
     * Retrieves the roles assigned to a user in a specific realm.
     *
     * @param realm The name of the realm.
     * @param userId The ID of the user.
     * @param accessToken The access token for authentication.
     * @return The roles assigned to the user.
     */
    public RoleMappings getUserRoles(String realm, String userId, String accessToken) {
        addTraceId();
        try {
            return keycloakClient.getUserRoles(realm, userId, "Bearer " + accessToken);
        } finally {
            clearTrace();
        }
    }

    /**
     * Retrieves all available roles in a specific realm, including both realm roles and client roles.
     *
     * @param realm The name of the realm.
     * @param token The access token for authentication.
     * @return A map containing realm roles and client roles.
     */
    public Map<String, Object> getAllAvailableRoles(String realm, String token) {
        Map<String, Object> allRoles = new HashMap<>();

        // Fetch realm roles
        List<Map<String, String>> realmRoles = listRealmRoles(realm, token);
        allRoles.put("realmRoles", realmRoles);

        // Fetch clients
        List<Map<String, Object>> clients = listClients(realm, token);

        // For each client, get roles
        Map<String, List<Map<String, String>>> clientRolesMap = new HashMap<>();
        for (Map<String, Object> client : clients) {
            String clientId = (String) client.get("id");
            String clientName = (String) client.get("clientId");

            List<Map<String, String>> clientRoles = listClientRoles(realm, clientId, token);
            clientRolesMap.put(clientName, clientRoles);
        }

        allRoles.put("clientRoles", clientRolesMap);
        return allRoles;
    }

    /**
     * Lists all roles in a specific realm.
     *
     * @param realm The name of the realm.
     * @param token The access token for authentication.
     * @return A list of roles in the specified realm.
     */
    public List<Map<String, String>> listRealmRoles(String realm, String token) {
        return keycloakClient.getAllRolesInRealm(realm, "Bearer " + token);
    }

    /**
     * Lists all clients in a specific realm.
     *
     * @param realm The name of the realm.
     * @param token The access token for authentication.
     * @return A list of clients in the specified realm.
     */
    public List<Map<String, Object>> listClients(String realm, String token) {
        return keycloakClient.listClients(realm, "Bearer " + token);
    }

    /**
     * Lists all roles of a specific client in a realm.
     *
     * @param realm The name of the realm.
     * @param clientId The ID of the client.
     * @param token The access token for authentication.
     * @return A list of roles for the specified client.
     */
    public List<Map<String, String>> listClientRoles(String realm, String clientId, String token) {
        return keycloakClient.getClientRoles(realm, clientId, "Bearer " + token);
    }

    /**
     * Adds realm roles to a user.
     * @param realm The name of the realm.
     * @param userId The ID of the user.
     * @param roles The list of roles to be added.
     * @param accessToken The access token for authentication.
     */
    public void addRealmRolesToUser(String realm, String userId, List<Map<String, String>> roles, String accessToken) {
        addTraceId();
        try {
            for (Map<String, String> role : roles) {
                String type = role.get("type");
                if (type.equals("realm")) {
                    role.remove("type");
                    keycloakClient.addRealmRolesToUser(realm, userId, "Bearer " + accessToken, List.of(role));
                } else if (type.startsWith("client:")) {
                    String clientName = type.split(":")[1];
                    String clientByName = keycloakClient.getClientIdByName(realm, clientName, "Bearer " + accessToken);
                    String clientIdByName = clientByName.split(",")[0].split(":")[1].replaceAll("[{}\"]", "");
                    role.remove("type");
                    keycloakClient.addClientRolesToUser(realm, userId, clientIdByName, "Bearer " + accessToken, List.of(role));
                }
            }
        } finally {
            clearTrace();
        }
    }

    /**
     * Removes realm roles from a user.
     * @param realm The name of the realm.
     * @param userId The ID of the user.
     * @param roles The list of roles to be removed.
     * @param accessToken The access token for authentication.
     */
    public void removeRealmRolesFromUser(String realm, String userId, List<Map<String, String>> roles, String accessToken) {
        addTraceId();
        try {
            for (Map<String, String> role : roles) {
                String type = role.get("type");
                if (type.equals("realm")) {
                    role.remove("type");
                    keycloakClient.removeRealmRolesFromUser(realm, userId, "Bearer " + accessToken, List.of(role));
                } else if (type.startsWith("client:")) {
                    String clientName = type.split(":")[1];
                    String clientByName = keycloakClient.getClientIdByName(realm, clientName, "Bearer " + accessToken);
                    String clientIdByName = clientByName.split(",")[0].split(":")[1].replaceAll("[{}\"]", "");
                    role.remove("type");
                    keycloakClient.removeClientRolesFromUser(realm, userId, clientIdByName, "Bearer " + accessToken, List.of(role));
                }
            }
        } finally {
            clearTrace();
        }
    }








}
