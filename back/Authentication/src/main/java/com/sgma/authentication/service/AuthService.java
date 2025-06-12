package com.sgma.authentication.service;

import com.sgma.authentication.client.KeycloakClient;
import com.sgma.authentication.model.ClientLogin;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;
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

    public void addRolesToUser(String realm, String userId, List<Map<String, String>> roles, String accessToken) {
        addTraceId();
        try {
            keycloakClient.addRolesToUser(realm, userId, "Bearer " + accessToken, roles);
        } finally {
            clearTrace();
        }
    }

    public void removeRolesFromUser(String realm, String userId, List<Map<String, String>> roles, String accessToken) {
        addTraceId();
        try {
            keycloakClient.removeRolesFromUser(realm, userId, "Bearer " + accessToken, roles);
        } finally {
            clearTrace();
        }
    }
}
