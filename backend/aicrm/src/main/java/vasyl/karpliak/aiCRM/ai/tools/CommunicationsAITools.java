package vasyl.karpliak.aiCRM.ai.tools;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;
import vasyl.karpliak.aiCRM.communications.domain.ChatSession;
import vasyl.karpliak.aiCRM.communications.domain.MailData;
import vasyl.karpliak.aiCRM.communications.domain.Message;
import vasyl.karpliak.aiCRM.communications.enums.SenderType;
import vasyl.karpliak.aiCRM.communications.repository.ChatSessionRepository;
import vasyl.karpliak.aiCRM.communications.repository.MessageRepository;
import vasyl.karpliak.aiCRM.communications.service.MailService;

import vasyl.karpliak.aiCRM.ai.dto.ChatSessionResponse;
import vasyl.karpliak.aiCRM.ai.dto.MessageResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CommunicationsAITools {

    private final MailService mailService;
    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    public CommunicationsAITools(MailService mailService, 
                                 ChatSessionRepository chatSessionRepository,
                                 MessageRepository messageRepository,
                                 org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate) {
        this.mailService = mailService;
        this.chatSessionRepository = chatSessionRepository;
        this.messageRepository = messageRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    private ChatSessionResponse mapToSessionResponse(ChatSession s) {
        return new ChatSessionResponse(s.getId(), s.getExternalChatId(), s.getChannelType() != null ? s.getChannelType().name() : null, s.getTeamId(), s.getStatus() != null ? s.getStatus().name() : null, s.getAssignedUserId());
    }

    private MessageResponse mapToMessageResponse(Message m) {
        return new MessageResponse(m.getId(), m.getSenderType() != null ? m.getSenderType().name() : null, m.getText(), m.getCreatedAt());
    }

    @Tool(description = "Надіслати email клієнту. Вкажіть email отримувача, тему та текст листа.")
    public String sendEmail(String to, String subject, String text) {
        MailData mailData = new MailData();
        mailData.setTo(List.of(to));
        mailData.setSubject(subject);
        mailData.setText(text);
        
        // Вказуємо системну пошту, з якої йде відправка (або можна брати з конфігу)
        mailService.SendToMail(mailData, "vasyl.karpliak.pp.2022@lpnu.ua");
        return "Email успішно заплановано до відправки на " + to;
    }

    @Tool(description = "Отримати список відкритих чатів (сесій) у Facebook Messenger для поточного користувача.")
    public List<ChatSessionResponse> getOpenChats(Long userId) {
        return chatSessionRepository.findByAssignedUserId(userId).stream()
                .map(this::mapToSessionResponse)
                .collect(Collectors.toList());
    }

    @Tool(description = "Прочитати історію повідомлень конкретного чату (за sessionId), щоб зрозуміти контекст розмови з клієнтом.")
    public List<MessageResponse> getChatHistory(Long sessionId) {
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    @Tool(description = "Відповісти клієнту безпосередньо у Facebook Messenger чат (за sessionId).")
    public String replyToFacebookChat(Long sessionId, String replyText) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Чат не знайдено"));

        vasyl.karpliak.aiCRM.communications.dto.UnifiedMessage unifiedMessage = new vasyl.karpliak.aiCRM.communications.dto.UnifiedMessage(
                null,
                session.getExternalChatId(),
                session.getChannelType(),
                session.getTeamId(),
                replyText,
                SenderType.OPERATOR,
                LocalDateTime.now()
        );
        
        rabbitTemplate.convertAndSend(
                vasyl.karpliak.aiCRM.communications.config.RabbitMQConfig.EXCHANGE, 
                vasyl.karpliak.aiCRM.communications.config.RabbitMQConfig.OUTBOUND_QUEUE, 
                unifiedMessage
        );

        Message message = new Message();
        message.setSession(session);
        message.setSenderType(SenderType.OPERATOR);
        message.setText(replyText);
        message.setCreatedAt(unifiedMessage.timestamp());
        messageRepository.save(message);

        return "Повідомлення успішно відправлено клієнту в Facebook Messenger.";
    }

    @Tool(description = "Отримати всі вхідні повідомлення від клієнтів за вказаний період (since — ISO дата-час початку, наприклад '2026-05-01T00:00:00'). Використовується для сумаризації активності за день, тиждень або місяць.")
    public List<MessageResponse> getMessagesSince(String sinceIso) {
        LocalDateTime since = LocalDateTime.parse(sinceIso);
        return messageRepository.findByCreatedAtAfterOrderByCreatedAtAsc(since).stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }
}
