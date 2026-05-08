package vasyl.karpliak.aiCRM.communications.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.communications.domain.ChatSession;
import vasyl.karpliak.aiCRM.communications.domain.Message;
import vasyl.karpliak.aiCRM.communications.enums.SenderType;
import vasyl.karpliak.aiCRM.communications.enums.SessionStatus;
import vasyl.karpliak.aiCRM.communications.repository.ChatSessionRepository;
import vasyl.karpliak.aiCRM.communications.repository.MessageRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chats")
public class ChatController {

    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    public ChatController(ChatSessionRepository chatSessionRepository,
                          MessageRepository messageRepository,
                          org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate) {
        this.chatSessionRepository = chatSessionRepository;
        this.messageRepository = messageRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * GET /chats — get all chat sessions for the current user (or all if TeamLead)
     */
    @GetMapping
    public ResponseEntity<List<ChatSession>> getChats(
            @RequestHeader(name = "X-User-Id") String userId,
            @RequestHeader(name = "X-User-Role", defaultValue = "USER") String userRole) {
        
        List<ChatSession> sessions;
        if ("TeamLead".equalsIgnoreCase(userRole) || "ADMIN".equalsIgnoreCase(userRole)) {
            sessions = chatSessionRepository.findAll();
        } else {
            sessions = chatSessionRepository.findByAssignedUserId(Long.parseLong(userId));
        }
        return ResponseEntity.ok(sessions);
    }

    /**
     * GET /chats/{id} — get a specific chat session
     */
    @GetMapping("/{id}")
    public ResponseEntity<ChatSession> getChat(@PathVariable Long id) {
        return chatSessionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /chats/{id}/messages — get message history for a chat session
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<Message>> getMessages(@PathVariable Long id) {
        if (!chatSessionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        List<Message> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(id);
        return ResponseEntity.ok(messages);
    }

    /**
     * POST /chats/{id}/messages — send a message to a chat session (from operator)
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<Message> sendMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(name = "X-User-Id") String userId) {

        return chatSessionRepository.findById(id)
                .map(session -> {
                    String text = body.getOrDefault("text", "");
                    
                    // Відправляємо у RabbitMQ для доставки в зовнішній канал
                    vasyl.karpliak.aiCRM.communications.dto.UnifiedMessage unifiedMessage = new vasyl.karpliak.aiCRM.communications.dto.UnifiedMessage(
                            null, // Немає external_id для вихідного повідомлення
                            session.getExternalChatId(),
                            session.getChannelType(),
                            session.getTeamId(),
                            text,
                            SenderType.OPERATOR,
                            LocalDateTime.now()
                    );
                    
                    rabbitTemplate.convertAndSend(
                            vasyl.karpliak.aiCRM.communications.config.RabbitMQConfig.EXCHANGE, 
                            vasyl.karpliak.aiCRM.communications.config.RabbitMQConfig.OUTBOUND_QUEUE, 
                            unifiedMessage
                    );

                    // Також зберігаємо відразу в БД, щоб фронтенд отримав миттєву відповідь
                    Message message = new Message();
                    message.setSession(session);
                    message.setSenderType(SenderType.OPERATOR);
                    message.setText(text);
                    message.setCreatedAt(unifiedMessage.timestamp());
                    Message saved = messageRepository.save(message);
                    return new ResponseEntity<>(saved, HttpStatus.CREATED);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /chats/{id} — delete a chat session and all its messages
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChat(@PathVariable Long id) {
        if (!chatSessionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        // Завдяки каскадному видаленню (або якщо немає обмежень) може знадобитись видалити повідомлення спочатку
        messageRepository.deleteBySessionId(id);
        chatSessionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /chats/stats — get chat statistics for Dashboard BFF
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long openChats = chatSessionRepository.countByStatus(SessionStatus.OPEN);
        long totalChats = chatSessionRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("openChats", openChats);
        stats.put("totalChats", totalChats);
        return ResponseEntity.ok(stats);
    }
}
