package vasyl.karpliak.aiCRM.communications.service;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMultipart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.communications.domain.EmailMessage;
import vasyl.karpliak.aiCRM.communications.domain.Notification;
import vasyl.karpliak.aiCRM.communications.repository.EmailMessageRepository;
import vasyl.karpliak.aiCRM.communications.repository.NotificationRepository;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Properties;

/**
 * Сервіс для отримання вхідних email через IMAP.
 * Перевіряє поштову скриньку кожні 60 секунд, зберігає нові листи в БД
 * та створює нотифікації для користувача.
 */
@Service
public class InboundEmailService {

    private static final Logger log = LoggerFactory.getLogger(InboundEmailService.class);

    @Value("${spring.mail.username}")
    private String mailUsername;

    @Value("${spring.mail.password}")
    private String mailPassword;

    @Value("${spring.mail.imap.host:imap.gmail.com}")
    private String imapHost;

    @Value("${spring.mail.imap.port:993}")
    private int imapPort;

    private final EmailMessageRepository emailMessageRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ApplicationEventPublisher eventPublisher;

    public InboundEmailService(EmailMessageRepository emailMessageRepository,
                               UserRepository userRepository,
                               NotificationRepository notificationRepository,
                               ApplicationEventPublisher eventPublisher) {
        this.emailMessageRepository = emailMessageRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Перевіряє вхідну пошту кожні 60 секунд.
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 10000)
    public void fetchInboundEmails() {
        try {
            // Знаходимо користувача за email
            User user = userRepository.findByEmail(mailUsername).orElse(null);
            if (user == null) {
                // Якщо не знайшли за email, беремо першого
                user = userRepository.findAll().stream().findFirst().orElse(null);
            }
            if (user == null) {
                log.warn("[IMAP] Не знайдено жодного користувача для прив'язки email.");
                return;
            }

            Store store = connectToImap();
            if (store == null) return;

            try {
                Folder inbox = store.getFolder("INBOX");
                inbox.open(Folder.READ_ONLY);

                int messageCount = inbox.getMessageCount();
                // Обмежуємо — беремо останні 20 листів
                int start = Math.max(1, messageCount - 19);
                Message[] messages = inbox.getMessages(start, messageCount);

                // Batch check for existing messages to avoid N+1 queries
                java.util.List<String> messageIds = new java.util.ArrayList<>();
                for (Message m : messages) {
                    String mid = getMessageId(m);
                    if (mid != null) messageIds.add(mid);
                }
                
                java.util.Set<String> existingIds = emailMessageRepository.findByExternalMessageIdIn(messageIds)
                        .stream()
                        .map(EmailMessage::getExternalMessageId)
                        .collect(java.util.stream.Collectors.toSet());

                int newCount = 0;
                for (Message message : messages) {
                    String messageId = getMessageId(message);
                    
                    // Перевіряємо чи вже збережений цей лист (за externalMessageId)
                    if (messageId != null && existingIds.contains(messageId)) {
                        continue;
                    }

                    String from = extractEmail(message.getFrom());
                    String subject = message.getSubject() != null ? message.getSubject() : "(без теми)";
                    String body = extractTextContent(message);
                    LocalDateTime timestamp = message.getReceivedDate() != null
                            ? message.getReceivedDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                            : LocalDateTime.now();

                    // Зберігаємо в БД
                    EmailMessage emailMsg = new EmailMessage();
                    emailMsg.setUser(user);
                    emailMsg.setSender(from);
                    emailMsg.setRecipient(mailUsername);
                    emailMsg.setSubject(subject);
                    emailMsg.setBody(body != null ? (body.length() > 5000 ? body.substring(0, 5000) : body) : "");
                    emailMsg.setFolder("INBOX");
                    emailMsg.setRead(false);
                    emailMsg.setTimestamp(timestamp);
                    emailMsg.setExternalMessageId(messageId);
                    emailMessageRepository.save(emailMsg);
                    newCount++;

                    // Створюємо нотифікацію
                    Notification notification = new Notification();
                    notification.setUser(user);
                    notification.setTitle("📧 Новий email");
                    notification.setMessage("Від: " + from + " — " + subject);
                    Notification saved = notificationRepository.save(notification);

                    eventPublisher.publishEvent(new NewNotificationEvent(
                            this, saved.getId(), user.getId(), saved.getTitle(), saved.getMessage()
                    ));
                }

                if (newCount > 0) {
                    log.info("[IMAP] Отримано {} нових листів.", newCount);
                }

                inbox.close(false);
            } finally {
                store.close();
            }
        } catch (Exception e) {
            log.error("[IMAP] Помилка отримання пошти: {}", e.getMessage());
        }
    }

    private Store connectToImap() {
        try {
            Properties props = new Properties();
            props.put("mail.store.protocol", "imaps");
            props.put("mail.imaps.host", imapHost);
            props.put("mail.imaps.port", String.valueOf(imapPort));
            props.put("mail.imaps.ssl.enable", "true");
            props.put("mail.imaps.ssl.trust", "*");

            Session session = Session.getInstance(props);
            Store store = session.getStore("imaps");
            store.connect(imapHost, mailUsername, mailPassword);
            return store;
        } catch (Exception e) {
            log.error("[IMAP] Не вдалося підключитися до IMAP: {}", e.getMessage());
            return null;
        }
    }

    private String getMessageId(Message message) {
        try {
            String[] headers = message.getHeader("Message-ID");
            return headers != null && headers.length > 0 ? headers[0] : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String extractEmail(Address[] addresses) {
        if (addresses == null || addresses.length == 0) return "unknown";
        if (addresses[0] instanceof InternetAddress) {
            return ((InternetAddress) addresses[0]).getAddress();
        }
        return addresses[0].toString();
    }

    private String extractTextContent(Message message) {
        try {
            Object content = message.getContent();
            if (content instanceof String) {
                return (String) content;
            }
            if (content instanceof MimeMultipart) {
                return extractFromMultipart((MimeMultipart) content);
            }
        } catch (Exception e) {
            log.debug("[IMAP] Не вдалося витягти текст з листа: {}", e.getMessage());
        }
        return "";
    }

    private String extractFromMultipart(MimeMultipart multipart) throws MessagingException, IOException {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart part = multipart.getBodyPart(i);
            if (part.isMimeType("text/plain")) {
                result.append(part.getContent().toString());
            } else if (part.getContent() instanceof MimeMultipart) {
                result.append(extractFromMultipart((MimeMultipart) part.getContent()));
            }
        }
        return result.toString();
    }
}
