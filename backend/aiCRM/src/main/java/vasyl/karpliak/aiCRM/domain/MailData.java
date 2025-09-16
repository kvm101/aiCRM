package vasyl.karpliak.aiCRM.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class MailData {
    List<String> to;
    String subject;
    String text;
    LocalDateTime when;
}
