package vasyl.karpliak.aiCRM.sales.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.sales.service.SalesIntegrationService;

import java.util.Map;

@RestController
@RequestMapping("/integration")
public class IntegrationController {

    private final SalesIntegrationService salesIntegrationService;

    public IntegrationController(SalesIntegrationService salesIntegrationService) {
        this.salesIntegrationService = salesIntegrationService;
    }

    @PostMapping("/incoming-message")
    public ResponseEntity<Void> receiveIncomingMessage(
            @RequestHeader(name = "X-User-Id") String userIdStr,
            @RequestBody Map<String, String> payload) {
        
        Long userId = Long.parseLong(userIdStr);
        String identifier = payload.get("identifier");
        String name = payload.get("name");
        String text = payload.get("text");

        salesIntegrationService.processIncomingMessage(userId, identifier, name, text);
        
        return ResponseEntity.ok().build();
    }
}
