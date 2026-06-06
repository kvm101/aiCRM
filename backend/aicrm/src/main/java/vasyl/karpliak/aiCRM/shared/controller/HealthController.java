package vasyl.karpliak.aiCRM.shared.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping
    public ResponseEntity HealthCheck() {
        return new ResponseEntity<>(Map.of("url", "http://localhost:8081", "status", "running"), HttpStatus.OK);
    }

    @GetMapping("/.well-known/oauth-authorization-server")
    public ResponseEntity<Map<String, String>> OAuthDiscovery() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "OAuth not configured", "message", "This server does not require OAuth"));
    }
}
