package vasyl.karpliak.aiCRM.ai.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.ai.domain.AiChatMessage;
import vasyl.karpliak.aiCRM.ai.dto.ChatRequest;
import vasyl.karpliak.aiCRM.ai.repository.AiChatMessageRepository;
import vasyl.karpliak.aiCRM.ai.service.AIChatService;
import vasyl.karpliak.aiCRM.shared.config.PendingToolRegistry;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AIChatController {

    private final AIChatService aiChatService;
    private final AiChatMessageRepository chatMessageRepository;
    private final PendingToolRegistry pendingToolRegistry;

    public AIChatController(AIChatService aiChatService,
                            AiChatMessageRepository chatMessageRepository,
                            PendingToolRegistry pendingToolRegistry) {
        this.aiChatService = aiChatService;
        this.chatMessageRepository = chatMessageRepository;
        this.pendingToolRegistry = pendingToolRegistry;
    }

    @PostMapping("/tools/approve/{id}")
    public ResponseEntity<Map<String, Object>> approveTool(@PathVariable("id") String id) {
        boolean success = pendingToolRegistry.approve(id);
        return ResponseEntity.ok(Map.of("success", success));
    }

    @PostMapping("/tools/reject/{id}")
    public ResponseEntity<Map<String, Object>> rejectTool(@PathVariable("id") String id) {
        boolean success = pendingToolRegistry.reject(id);
        return ResponseEntity.ok(Map.of("success", success));
    }

    @PostMapping("/chat")
    public Map<String, Object> chat(
            @RequestBody ChatRequest request,
            @RequestHeader(name = "X-User-Id", defaultValue = "1") String userIdStr) {

        String message = request.message();
        if (message == null || message.isBlank()) {
            return Map.of("reply", "Будь ласка, введіть повідомлення.");
        }

        try {
            Long userId = Long.parseLong(userIdStr);
            List<ChatRequest.HistoryMessage> history = request.history();
            String modelProvider = request.modelProvider();
            String reply = aiChatService.generateReply(message, userId, history, modelProvider);

            // Зберігаємо повідомлення користувача та відповідь AI в БД
            saveMessage(userId, "user", message);
            saveMessage(userId, "ai", reply);

            long totalMessages = chatMessageRepository.countByUserId(userId);
            boolean shouldClear = totalMessages >= 20;

            return Map.of(
                "reply", reply,
                "totalMessages", totalMessages,
                "shouldClear", shouldClear
            );
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("reply", "Помилка при зверненні до AI: " + e.getMessage());
        }
    }

    /**
     * Отримати збережену історію чату для поточного користувача.
     */
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @RequestHeader(name = "X-User-Id", defaultValue = "1") String userIdStr) {
        Long userId = Long.parseLong(userIdStr);
        List<AiChatMessage> messages = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);

        List<Map<String, Object>> result = messages.stream()
                .map(m -> Map.<String, Object>of(
                        "id", m.getId(),
                        "role", m.getRole(),
                        "content", m.getContent(),
                        "timestamp", m.getCreatedAt().toString()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    /**
     * Очистити всю історію чату користувача.
     */
    @DeleteMapping("/history")
    @Transactional
    public ResponseEntity<Map<String, String>> clearHistory(
            @RequestHeader(name = "X-User-Id", defaultValue = "1") String userIdStr) {
        Long userId = Long.parseLong(userIdStr);
        chatMessageRepository.deleteByUserId(userId);
        return ResponseEntity.ok(Map.of("status", "cleared"));
    }

    private void saveMessage(Long userId, String role, String content) {
        AiChatMessage msg = new AiChatMessage();
        msg.setUserId(userId);
        msg.setRole(role);
        msg.setContent(content);
        chatMessageRepository.save(msg);
    }
}
