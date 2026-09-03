package vasyl.karpliak.aiCRM.shared.controller;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping("/.well-known/oauth-authorization-server")
  public ResponseEntity<Map<String, String>> OAuthDiscovery() {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(
            Map.of(
                "error", "OAuth not configured", "message", "This server does not require OAuth"));
  }
}
