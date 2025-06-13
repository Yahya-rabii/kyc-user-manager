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

    public ResponseEntity<Map<String, Object>> authenticateClient(ClientLogin client) {
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


    public  ResponseEntity<Map<String, Object>>  refresh(String refreshToken) {
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



    public void logout(String realm, String userId, String accessToken) {
        addTraceId();
        try {
            keycloakClient.logout(realm, userId, "Bearer " + accessToken);
        } finally {
            clearTrace();
        }
    }

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

    public List<Map<String, Object>> listUsersInRealm(String realm, String accessToken) {
        addTraceId();
        try {
            return keycloakClient.listUsers(realm, "Bearer " + accessToken);
        } finally {
            clearTrace();
        }
    }

    public RoleMappings getUserRoles(String realm, String userId, String accessToken) {
        addTraceId();
        try {
            return keycloakClient.getUserRoles(realm, userId, "Bearer " + accessToken);
        } finally {
            clearTrace();
        }
    }



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

    public List<Map<String, String>> listRealmRoles(String realm, String token) {
        // Call GET /admin/realms/{realm}/roles
        // Return list of role name & description
        return keycloakClient.getAllRolesInRealm(realm, "Bearer " + token);
    }

    public List<Map<String, Object>> listClients(String realm, String token) {
        return keycloakClient.listClients(realm, "Bearer " + token);
    }

    // get roles of a client by clientId

    public List<Map<String, String>> listClientRoles(String realm, String clientId, String token) {
        // Call GET /admin/realms/{realm}/clients/{clientId}/roles
        // Return list of role name & description
        return keycloakClient.getClientRoles(realm, clientId, "Bearer " + token);
    }



    public void addRolesToUser(String realm, String userId, List<Map<String, String>> roles, String accessToken) {
        addTraceId();
        try {
            for (Map<String, String> role : roles) {
                String type = role.get("type");
                if (type.equals("realm")) {
                    // the roles list that will be sent to Keycloak should not contain the "type" key
                    // so we create a new list without the "type" key
                    role.remove("type");
                    keycloakClient.addRolesToUser(realm, userId, "Bearer " + accessToken, List.of(role));
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

    public void removeRolesFromUser(String realm, String userId, List<Map<String, String>> roles, String accessToken) {
        addTraceId();
        try {
            for (Map<String, String> role : roles) {
                String type = role.get("type");
                if (type.equals("realm")) {
                    // the roles list that will be sent to Keycloak should not contain the "type" key
                    // so we create a new list without the "type" key
                    role.remove("type");
                    keycloakClient.removeRolesFromUser(realm, userId, "Bearer " + accessToken, List.of(role));
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
