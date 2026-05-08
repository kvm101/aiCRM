package vasyl.karpliak.aiCRM.communications.service;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vasyl.karpliak.aiCRM.communications.config.RabbitMQConfig;
import vasyl.karpliak.aiCRM.communications.domain.ChatSession;
import vasyl.karpliak.aiCRM.communications.domain.Message;
import vasyl.karpliak.aiCRM.communications.dto.UnifiedMessage;
import vasyl.karpliak.aiCRM.communications.enums.SessionStatus;
import vasyl.karpliak.aiCRM.communications.repository.ChatSessionRepository;
import vasyl.karpliak.aiCRM.communications.repository.MessageRepository;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.enums.UserRoles;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;

import java.util.Optional;

@Service
public class MessageDispatcherService {

    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public MessageDispatcherService(ChatSessionRepository chatSessionRepository,
                                    MessageRepository messageRepository,
                                    UserRepository userRepository,
                                    ApplicationEventPublisher eventPublisher) {
        this.chatSessionRepository = chatSessionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    @RabbitListener(queues = RabbitMQConfig.INBOUND_QUEUE)
    public void processInboundMessage(UnifiedMessage unifiedMessage) {
        // 1. Перевіряємо, чи існує відкрита сесія для цього клієнта та команди
        Optional<ChatSession> optionalSession = chatSessionRepository
                .findByExternalChatIdAndChannelTypeAndTeamId(
                        unifiedMessage.externalChatId(),
                        unifiedMessage.channel(),
                        unifiedMessage.teamId()
                );

        ChatSession session;
        if (optionalSession.isPresent() && optionalSession.get().getStatus() == SessionStatus.OPEN) {
            session = optionalSession.get();
        } else {
            // 2. Логіка Round-Robin: шукаємо оператора або менеджера, 
            // у якого найдавніший час останнього входу (спрощена реалізація).
            User assignedUser = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == UserRoles.SUPPORT || u.getRole() == UserRoles.MANAGER)
                    .min((u1, u2) -> u1.getLastEnter().compareTo(u2.getLastEnter()))
                    .orElse(userRepository.findAll().stream().findFirst().orElse(null));

            Long assignedUserId = assignedUser != null ? assignedUser.getId() : null;

            // Створюємо нову сесію
            session = new ChatSession();
            session.setExternalChatId(unifiedMessage.externalChatId());
            session.setChannelType(unifiedMessage.channel());
            session.setTeamId(unifiedMessage.teamId());
            session.setAssignedUserId(assignedUserId);
            session.setStatus(SessionStatus.OPEN);
            
            session = chatSessionRepository.save(session);
        }

        // 3. Зберігаємо повідомлення в базу даних
        Message message = new Message();
        message.setSession(session);
        message.setExternalMessageId(unifiedMessage.externalId());
        message.setSenderType(unifiedMessage.senderType());
        message.setText(unifiedMessage.text());
        message.setCreatedAt(unifiedMessage.timestamp());

        messageRepository.save(message);

        // 4. Публікуємо Spring Event (далі його може перехопити WebSocket контролер або інший сервіс)
        eventPublisher.publishEvent(new InboundMessageEvent(this, message, session.getAssignedUserId()));
    }
}
