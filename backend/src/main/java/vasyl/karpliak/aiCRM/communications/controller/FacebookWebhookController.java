package vasyl.karpliak.aiCRM.communications.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Placeholder for the Facebook Messenger webhook controller.
 *
 * <p>Facebook Messenger integration is not yet implemented. All endpoints return {@code 501 Not
 * Implemented} until the real integration is built.
 */
@RestController
@RequestMapping("/api/webhooks/facebook")
public class FacebookWebhookController {

  /** Placeholder for Facebook webhook verification. */
  @GetMapping
  public ResponseEntity<String> verifyWebhook() {
    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
        .body("Facebook Messenger integration is not implemented yet.");
  }

  /** Placeholder for receiving Facebook Messenger messages. */
  @PostMapping
  public ResponseEntity<String> receiveMessage() {
    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
        .body("Facebook Messenger integration is not implemented yet.");
  }
}
