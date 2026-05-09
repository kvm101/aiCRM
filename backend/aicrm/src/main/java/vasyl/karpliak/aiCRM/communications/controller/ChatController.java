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
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public ChatController(ChatSessionRepository chatSessionRepository,
                          MessageRepository messageRepository,
                          org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate,
                          org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.chatSessionRepository = chatSessionRepository;
        this.messageRepository = messageRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.eventPublisher = eventPublisher;
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
     * POST /chats — create a new internal team chat session
     */
    @PostMapping
    public ResponseEntity<ChatSession> createChat(
            @RequestBody Map<String, String> body,
            @RequestHeader(name = "X-User-Id") String userId) {
        
        String title = body.get("title");
        if (title == null || title.trim().isEmpty()) {
            title = "Командний чат";
        }
        
        ChatSession session = new ChatSession();
        session.setExternalChatId("internal-" + java.util.UUID.randomUUID().toString());
        session.setChannelType(vasyl.karpliak.aiCRM.communications.enums.ChannelType.INTERNAL);
        session.setTeamId(1L); // Default team ID
        session.setAssignedUserId(Long.parseLong(userId));
        session.setStatus(SessionStatus.OPEN);
        session.setClientName(title);
        
        ChatSession saved = chatSessionRepository.save(session);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
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
                    
                    // Відправляємо у RabbitMQ для доставки в зовнішній канал, якщо це не внутрішній чат
                    if (session.getChannelType() != vasyl.karpliak.aiCRM.communications.enums.ChannelType.INTERNAL) {
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
                    }

                    // Також зберігаємо відразу в БД, щоб фронтенд отримав миттєву відповідь
                    Message message = new Message();
                    message.setSession(session);
                    message.setSenderType(SenderType.OPERATOR);
                    message.setText(text);
                    message.setCreatedAt(LocalDateTime.now());
                    
                    // Reset unread count since operator replied
                    session.setUnreadCount(0);
                    chatSessionRepository.save(session);
                    
                    Message saved = messageRepository.save(message);

                    // Відправляємо подію для WebSocket, щоб інші учасники командного чату миттєво побачили повідомлення
                    if (session.getChannelType() == vasyl.karpliak.aiCRM.communications.enums.ChannelType.INTERNAL) {
                        eventPublisher.publishEvent(new vasyl.karpliak.aiCRM.communications.service.InboundMessageEvent(this, saved, session.getAssignedUserId()));
                    }

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

    /**
     * PATCH /chats/{id}/read — reset unread count for a chat session
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markChatAsRead(@PathVariable Long id) {
        return chatSessionRepository.findById(id).map(session -> {
            session.setUnreadCount(0);
            chatSessionRepository.save(session);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
