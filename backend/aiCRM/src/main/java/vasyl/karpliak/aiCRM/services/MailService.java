package vasyl.karpliak.aiCRM.services;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.domain.MailData;

import java.time.Instant;
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

    public void SendToMail(MailData mailData) {
        SimpleMailMessage msg = new SimpleMailMessage();
        List<String> mails = new ArrayList<>(mailData.getTo());

        msg.setTo(mails.toArray(new String[0]));
        msg.setSubject(mailData.getSubject());
        msg.setText(mailData.getText());

        Instant sendTime = mailData.getWhen()
                .atZone(ZoneId.systemDefault())
                .toInstant();

        taskScheduler.schedule(() -> jms.send(msg), sendTime);
    }
}
