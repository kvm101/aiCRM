package vasyl.karpliak.aiCRM.services;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.domain.MailData;
import vasyl.karpliak.aiCRM.repository.UserRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class MailService {
    private final JavaMailSender jms;
    private final TaskScheduler taskScheduler;

    public MailService(JavaMailSender jms, TaskScheduler taskScheduler) {
        this.jms =  jms;
        this.taskScheduler = taskScheduler;
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

        taskScheduler.schedule(() -> jms.send(msg), sendTime);

        return mailData;
    }
}
