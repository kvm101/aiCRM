package vasyl.karpliak.aiCRM.communications.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.sales.service.SalesIntegrationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/facebook")
public class FacebookWebhookController {

    @Value("${facebook.messenger.verify-token}")
    private String verifyToken;

    private final SalesIntegrationService salesIntegrationService;

    public FacebookWebhookController(SalesIntegrationService salesIntegrationService) {
        this.salesIntegrationService = salesIntegrationService;
    }

    /**
     * Endpoint for Facebook Webhook verification
     */
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            System.out.println("WEBHOOK_VERIFIED");
            return ResponseEntity.ok(challenge);
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * Endpoint for receiving Facebook Messenger messages
     */
    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<String> receiveMessage(@RequestBody Map<String, Object> payload) {
        System.out.println("Received Facebook Webhook: " + payload);

        try {
            String object = (String) payload.get("object");
            if ("page".equals(object)) {
                List<Map<String, Object>> entries = (List<Map<String, Object>>) payload.get("entry");
                for (Map<String, Object> entry : entries) {
                    List<Map<String, Object>> messagingEvents = (List<Map<String, Object>>) entry.get("messaging");
                    if (messagingEvents != null) {
                        for (Map<String, Object> event : messagingEvents) {
                            Map<String, Object> sender = (Map<String, Object>) event.get("sender");
                            Map<String, Object> message = (Map<String, Object>) event.get("message");

                            if (sender != null && message != null) {
                                String senderId = (String) sender.get("id");
                                String text = (String) message.get("text");

                                if (text != null && !text.isBlank()) {
                                    // Process the incoming message via our CRM integration service
                                    // We use a default user ID 1L (Team Lead) for assigning incoming chats
                                    salesIntegrationService.processIncomingMessage(1L, senderId, "Facebook User", text);
                                }
                            }
                        }
                    }
                }
                return ResponseEntity.ok("EVENT_RECEIVED");
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
