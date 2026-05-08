package vasyl.karpliak.aiCRM.ai.controller;

import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.ai.service.AIChatService;

import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AIChatController {

    private final AIChatService aiChatService;

    public AIChatController(AIChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/chat")
    public Map<String, String> chat(
            @RequestBody Map<String, String> request,
            @RequestHeader(name = "X-User-Id", defaultValue = "1") String userIdStr) {
            
        String message = request.getOrDefault("message", "");
        if (message.isBlank()) {
            return Map.of("reply", "Будь ласка, введіть повідомлення.");
        }
        
        try {
            Long userId = Long.parseLong(userIdStr);
            String reply = aiChatService.generateReply(message, userId);
            return Map.of("reply", reply);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("reply", "Помилка при зверненні до AI: " + e.getMessage());
        }
    }
}
