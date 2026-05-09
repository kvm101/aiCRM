package vasyl.karpliak.aiCRM.communications.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.communications.domain.MailData;
import vasyl.karpliak.aiCRM.communications.domain.EmailMessage;
import vasyl.karpliak.aiCRM.communications.dto.EmailMessageDto;
import vasyl.karpliak.aiCRM.communications.repository.EmailMessageRepository;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MailService {
    private final JavaMailSender jms;
    private final TaskScheduler taskScheduler;
    private final EmailMessageRepository emailMessageRepository;
    private final UserRepository userRepository;

    public MailService(JavaMailSender jms, TaskScheduler taskScheduler, EmailMessageRepository emailMessageRepository, UserRepository userRepository) {
        this.jms =  jms;
        this.taskScheduler = taskScheduler;
        this.emailMessageRepository = emailMessageRepository;
        this.userRepository = userRepository;
    }

    public MailData SendToMail(MailData mailData, String sendFrom) {
        SimpleMailMessage msg = new SimpleMailMessage();
        List<String> mails = new ArrayList<>(mailData.getTo());


        msg.setFrom(sendFrom);
        msg.setTo(mails.toArray(new String[0]));
        msg.setSubject(mailData.getSubject());
        msg.setText(mailData.getText());

        if (mailData.getWhen() == null) {
            LocalDateTime now = LocalDateTime.now();
            mailData.setWhen(now);
        }

        Instant sendTime = mailData.getWhen()
                .atZone(ZoneId.systemDefault())
                .toInstant();

        taskScheduler.schedule(() -> {
            jms.send(msg);
        }, sendTime);

        // Save to DB
        userRepository.findByEmail(sendFrom).ifPresent(user -> {
            for (String to : mails) {
                EmailMessage emailMessage = new EmailMessage();
                emailMessage.setUser(user);
                emailMessage.setSender(sendFrom);
                emailMessage.setRecipient(to);
                emailMessage.setSubject(mailData.getSubject());
                emailMessage.setBody(mailData.getText());
                emailMessage.setTimestamp(mailData.getWhen());
                emailMessage.setFolder("SENT");
                emailMessage.setRead(true);
                emailMessageRepository.save(emailMessage);
            }
        });

        return mailData;
    }

    public List<EmailMessageDto> getFolderEmails(Long userId, String folder, String role) {
        List<EmailMessage> messages;
        if ("TeamLead".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)) {
            messages = emailMessageRepository.findByFolderOrderByTimestampDesc(folder);
        } else {
            messages = emailMessageRepository.findByUserIdAndFolderOrderByTimestampDesc(userId, folder);
        }
        
        return messages.stream()
                .map(msg -> new EmailMessageDto(
                        msg.getId(),
                        msg.getSender(),
                        msg.getRecipient(),
                        msg.getSubject(),
                        msg.getBody(),
                        msg.getFolder(),
                        msg.isRead(),
                        msg.getTimestamp()
                )).collect(Collectors.toList());
    }

    public void markEmailAsRead(Long emailId) {
        emailMessageRepository.findById(emailId).ifPresent(msg -> {
            msg.setRead(true);
            emailMessageRepository.save(msg);
        });
    }
}
