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
import vasyl.karpliak.aiCRM.communications.domain.Notification;
import vasyl.karpliak.aiCRM.communications.repository.NotificationRepository;
import vasyl.karpliak.aiCRM.communications.enums.SenderType;

import java.util.Optional;

@Service
public class MessageDispatcherService {

    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ApplicationEventPublisher eventPublisher;

    public MessageDispatcherService(ChatSessionRepository chatSessionRepository,
                                    MessageRepository messageRepository,
                                    UserRepository userRepository,
                                    NotificationRepository notificationRepository,
                                    ApplicationEventPublisher eventPublisher) {
        this.chatSessionRepository = chatSessionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
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
            // 2. Round-Robin: шукаємо будь-якого активного оператора/менеджера/адміна.
            // Пріоритет: SUPPORT > MANAGER > ACCOUNT_MANAGER > ADMIN > будь-який юзер.
            User assignedUser = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == UserRoles.SUPPORT
                              || u.getRole() == UserRoles.MANAGER
                              || u.getRole() == UserRoles.ACCOUNT_MANAGER
                              || u.getRole() == UserRoles.ADMIN)
                    .min((u1, u2) -> u1.getLastEnter().compareTo(u2.getLastEnter()))
                    .orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));

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

        // Якщо повідомлення від клієнта, збільшуємо лічильник непрочитаних та створюємо сповіщення
        if (unifiedMessage.senderType() == SenderType.CLIENT) {
            session.setUnreadCount(session.getUnreadCount() + 1);
            chatSessionRepository.save(session);

            if (session.getAssignedUserId() != null) {
                String externalChatId = session.getExternalChatId();
                Long targetUserId = session.getAssignedUserId();

                userRepository.findById(targetUserId).ifPresent(user -> {
                    Notification notification = new Notification();
                    notification.setUser(user);
                    notification.setTitle("Нове повідомлення");
                    notification.setMessage("У вас нове повідомлення в чаті " + externalChatId);
                    Notification saved = notificationRepository.save(notification);
                    // Передаємо лише примітиви — без lazy-зв'язків та до commit!
                    eventPublisher.publishEvent(new NewNotificationEvent(
                            this,
                            saved.getId(),
                            user.getId(),
                            saved.getTitle(),
                            saved.getMessage()
                    ));
                });
            }
        }

        // 4. Публікуємо Spring Event (далі його може перехопити WebSocket контролер або інший сервіс)
        eventPublisher.publishEvent(new InboundMessageEvent(this, message, session.getAssignedUserId()));
    }
}