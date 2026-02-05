package com.pmsmanus.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class OAuthController {
    @GetMapping("/auth/me")
    public ResponseEntity<?> me(HttpSession session) {
        Object user = session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Please login (10001)"));
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/auth/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/oauth/google/login")
    public ResponseEntity<?> googleLogin(
            HttpServletRequest request,
            HttpSession session,
            @RequestParam(value = "to", required = false) String toParam,
            @RequestParam(value = "state", required = false) String legacyStateParam,
            @RequestParam(value = "json", required = false) String jsonParam) {
        String clientId = System.getenv("GOOGLE_CLIENT_ID");
        String redirectUri = System.getenv("GOOGLE_REDIRECT_URI");
        if (redirectUri == null || redirectUri.isBlank()) {
            String scheme = request.getScheme();
            int port = request.getServerPort();
            redirectUri = scheme + "://localhost:" + port + "/api/oauth/google/callback";
        }
        if (clientId == null || clientId.isBlank()) {
            return ResponseEntity.status(500).body(Map.of("message", "Google OAuth not configured"));
        }
        String desired = toParam != null ? toParam : legacyStateParam;
        String origin = request.getHeader("Origin");
        if (desired == null || desired.isBlank()) {
            desired = "/";
        } else {
            try {
                URI desiredUri = URI.create(desired);
                String host = desiredUri.getHost();
                if (host == null) {
                    desired = "/";
                } else {
                    boolean allowed =
                            (origin != null && desired.startsWith(origin))
                                    || desired.startsWith("http://localhost:5173")
                                    || desired.startsWith("https://localhost:5173")
                                    || desired.startsWith("http://localhost:5174")
                                    || desired.startsWith("https://localhost:5174")
                                    || desired.startsWith("http://127.0.0.1:5173")
                                    || desired.startsWith("http://127.0.0.1:5174");
                    if (!allowed) {
                        desired = "/";
                    }
                }
            } catch (Exception e) {
                desired = "/";
            }
        }
        String nonce = java.util.UUID.randomUUID().toString();
        session.setAttribute("oauth_state", nonce);
        session.setAttribute("oauth_redirect", desired);
        String scope = "openid email profile";
        String responseType = "code";
        String accessType = "offline";
        String prompt = "consent";
        String state = nonce;
        String url = "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&response_type=" + responseType
                + "&scope=" + scope.replace(" ", "%20")
                + "&access_type=" + accessType
                + "&prompt=" + prompt
                + "&include_granted_scopes=true"
                + "&state=" + state;
        boolean wantJson = "1".equals(jsonParam) || "true".equalsIgnoreCase(jsonParam)
                || (request.getHeader("Accept") != null && request.getHeader("Accept").contains("application/json"));
        if (wantJson) {
            return ResponseEntity.ok(Map.of("url", url));
        } else {
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create(url));
            return ResponseEntity.status(302).headers(headers).build();
        }
    }

    @GetMapping("/oauth/google/callback")
    public ResponseEntity<?> googleCallback(
            HttpServletRequest request,
            HttpSession session,
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String stateParam) {
        String expectedState = (String) session.getAttribute("oauth_state");
        if (expectedState == null || !expectedState.equals(stateParam)) {
            return ResponseEntity.status(400).body(Map.of("message", "Invalid OAuth state"));
        }
        String clientId = System.getenv("GOOGLE_CLIENT_ID");
        String clientSecret = System.getenv("GOOGLE_CLIENT_SECRET");
        String redirectUri = System.getenv("GOOGLE_REDIRECT_URI");
        if (redirectUri == null || redirectUri.isBlank()) {
            String scheme = request.getScheme();
            int port = request.getServerPort();
            redirectUri = scheme + "://localhost:" + port + "/api/oauth/google/callback";
        }
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            return ResponseEntity.status(500).body(Map.of("message", "Google OAuth not configured"));
        }

        RestTemplate http = new RestTemplate();
        String tokenUrl = "https://oauth2.googleapis.com/token";
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");

        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, tokenHeaders);
        Map<?, ?> tokenResp;
        try {
            tokenResp = http.postForObject(tokenUrl, entity, Map.class);
        } catch (RestClientException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to exchange OAuth code: " + e.getMessage()));
        }
        if (tokenResp == null || tokenResp.get("id_token") == null) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to exchange OAuth code"));
        }
        String idToken = String.valueOf(tokenResp.get("id_token"));

        String infoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
        Map<?, ?> info;
        try {
            info = http.getForObject(infoUrl, Map.class);
        } catch (RestClientException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to verify ID token: " + e.getMessage()));
        }
        if (info == null || info.get("email") == null) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to verify ID token"));
        }

        Map<String, Object> user = new HashMap<>();
        user.put("id", info.get("sub"));
        user.put("email", info.get("email"));
        Object nameObj = info.get("name");
        Object picObj = info.get("picture");
        user.put("name", nameObj == null ? "" : String.valueOf(nameObj));
        user.put("picture", picObj == null ? "" : String.valueOf(picObj));
        session.setAttribute("user", user);
        session.setMaxInactiveInterval(3600);

        String desired = (String) session.getAttribute("oauth_redirect");
        if (desired == null || desired.isBlank()) desired = "/";
        session.removeAttribute("oauth_state");
        session.removeAttribute("oauth_redirect");
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(desired));
        return ResponseEntity.status(302).headers(headers).build();
    }
}
