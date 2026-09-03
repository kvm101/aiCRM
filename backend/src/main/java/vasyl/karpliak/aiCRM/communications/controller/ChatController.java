package vasyl.karpliak.aiCRM.communications.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.communications.domain.ChatSession;
import vasyl.karpliak.aiCRM.communications.domain.Message;
import vasyl.karpliak.aiCRM.communications.enums.SenderType;
import vasyl.karpliak.aiCRM.communications.enums.SessionStatus;
import vasyl.karpliak.aiCRM.communications.repository.ChatSessionRepository;
import vasyl.karpliak.aiCRM.communications.repository.MessageRepository;

@RestController
@RequestMapping("/chats")
public class ChatController {

  private final ChatSessionRepository chatSessionRepository;
  private final MessageRepository messageRepository;
  private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;
  private final org.springframework.context.ApplicationEventPublisher eventPublisher;

  public ChatController(
      ChatSessionRepository chatSessionRepository,
      MessageRepository messageRepository,
      org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate,
      org.springframework.context.ApplicationEventPublisher eventPublisher) {
    this.chatSessionRepository = chatSessionRepository;
    this.messageRepository = messageRepository;
    this.rabbitTemplate = rabbitTemplate;
    this.eventPublisher = eventPublisher;
  }

  /** GET /chats — get all chat sessions for the current user (or all if TeamLead) */
  @GetMapping
  public ResponseEntity<List<ChatSession>> getChats(
      @RequestHeader(name = "X-Project-Id", required = false) String projectId,
      @RequestHeader(name = "X-User-Role", defaultValue = "USER") String userRole) {

    List<ChatSession> sessions = chatSessionRepository.findByProjectId(resolveProjectId(projectId));
    return ResponseEntity.ok(sessions);
  }

  /** POST /chats — create a new internal team chat session */
  @PostMapping
  public ResponseEntity<ChatSession> createChat(
      @RequestBody Map<String, String> body,
      @RequestHeader(name = "X-Project-Id") String projectId,
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

    // We can't set project directly here unless we fetch it from IAM module.
    // For MVP we just use an entity with only the ID.
    vasyl.karpliak.aiCRM.iam.domain.Project projectRef =
        new vasyl.karpliak.aiCRM.iam.domain.Project();
    projectRef.setId(Long.parseLong(projectId));
    session.setProject(projectRef);

    ChatSession saved = chatSessionRepository.save(session);
    return new ResponseEntity<>(saved, HttpStatus.CREATED);
  }

  /** GET /chats/{id} — get a specific chat session */
  @GetMapping("/{id}")
  public ResponseEntity<ChatSession> getChat(@PathVariable Long id) {
    return chatSessionRepository
        .findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  /** GET /chats/{id}/messages — get message history for a chat session */
  @GetMapping("/{id}/messages")
  public ResponseEntity<List<Message>> getMessages(@PathVariable Long id) {
    if (!chatSessionRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    List<Message> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(id);
    return ResponseEntity.ok(messages);
  }

  /** POST /chats/{id}/messages — send a message to a chat session (from operator) */
  @Transactional
  @PostMapping("/{id}/messages")
  public ResponseEntity<Message> sendMessage(
      @PathVariable Long id,
      @RequestBody Map<String, String> body,
      @RequestHeader(name = "X-User-Id", required = false) String userId) {

    return chatSessionRepository
        .findById(id)
        .map(
            session -> {
              String text = body.getOrDefault("text", "");

              // Відправляємо у RabbitMQ для доставки в зовнішній канал, якщо це не внутрішній чат
              if (session.getChannelType()
                  != vasyl.karpliak.aiCRM.communications.enums.ChannelType.INTERNAL) {
                vasyl.karpliak.aiCRM.communications.dto.UnifiedMessage unifiedMessage =
                    new vasyl.karpliak.aiCRM.communications.dto.UnifiedMessage(
                        null,
                        session.getExternalChatId(),
                        session.getChannelType(),
                        session.getTeamId(),
                        text,
                        SenderType.OPERATOR,
                        LocalDateTime.now());

                rabbitTemplate.convertAndSend(
                    vasyl.karpliak.aiCRM.communications.config.RabbitMQConfig.EXCHANGE,
                    vasyl.karpliak.aiCRM.communications.config.RabbitMQConfig.OUTBOUND_QUEUE,
                    unifiedMessage);
              }

              // Зберігаємо в БД
              Message message = new Message();
              message.setSession(session);
              message.setSenderType(SenderType.OPERATOR);
              message.setText(text);
              message.setCreatedAt(LocalDateTime.now());

              // Скидаємо лічильник непрочитаних (оператор відповів)
              session.setUnreadCount(0);
              chatSessionRepository.save(session);

              Message saved = messageRepository.save(message);

              // Публікуємо WS подію для ВСІХ типів чатів (не тільки INTERNAL)
              // щоб усі вкладки браузера отримали оновлення в реальному часі
              eventPublisher.publishEvent(
                  new vasyl.karpliak.aiCRM.communications.service.InboundMessageEvent(
                      this, saved, session.getAssignedUserId()));

              return new ResponseEntity<>(saved, HttpStatus.CREATED);
            })
        .orElse(ResponseEntity.notFound().build());
  }

  /** DELETE /chats/{id} — delete a chat session and all its messages */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteChat(@PathVariable Long id) {
    if (!chatSessionRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    // Завдяки каскадному видаленню (або якщо немає обмежень) може знадобитись видалити повідомлення
    // спочатку
    messageRepository.deleteBySessionId(id);
    chatSessionRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  /** GET /chats/stats — get chat statistics for Dashboard BFF */
  @GetMapping("/stats")
  public ResponseEntity<Map<String, Object>> getStats(
      @RequestHeader(name = "X-Project-Id", required = false) String projectIdStr) {
    Long projectId = resolveProjectId(projectIdStr);
    long openChats = chatSessionRepository.countByStatusAndProjectId(SessionStatus.OPEN, projectId);
    long totalChats = chatSessionRepository.countByProjectId(projectId);

    Map<String, Object> stats = new HashMap<>();
    stats.put("openChats", openChats);
    stats.put("totalChats", totalChats);
    return ResponseEntity.ok(stats);
  }

  private Long resolveProjectId(String projectIdStr) {
    if (projectIdStr != null && !projectIdStr.isBlank()) {
      return Long.parseLong(projectIdStr);
    }
    return vasyl.karpliak.aiCRM.shared.context.RequestContextHelper.getCurrentProjectId();
  }

  /** PATCH /chats/{id}/read — reset unread count for a chat session */
  @PatchMapping("/{id}/read")
  public ResponseEntity<Void> markChatAsRead(@PathVariable Long id) {
    return chatSessionRepository
        .findById(id)
        .map(
            session -> {
              session.setUnreadCount(0);
              chatSessionRepository.save(session);
              return ResponseEntity.ok().<Void>build();
            })
        .orElse(ResponseEntity.notFound().build());
  }

  /** PATCH /chats/{id}/rename — rename chat session client name */
  @PatchMapping("/{id}/rename")
  public ResponseEntity<ChatSession> renameChat(
      @PathVariable Long id, @RequestBody Map<String, String> body) {
    return chatSessionRepository
        .findById(id)
        .map(
            session -> {
              String newName = body.get("clientName");
              if (newName != null && !newName.trim().isEmpty()) {
                session.setClientName(newName.trim());
                chatSessionRepository.save(session);
              }
              return ResponseEntity.ok(session);
            })
        .orElse(ResponseEntity.notFound().build());
  }
}
