package vasyl.karpliak.aiCRM.dto;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MailDataReminderDTO {
    String subject;
    String text;
    LocalDateTime when;
}
