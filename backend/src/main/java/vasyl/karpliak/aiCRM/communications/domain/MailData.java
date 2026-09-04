package vasyl.karpliak.aiCRM.communications.domain;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MailData {
  List<String> to;
  String subject;
  String text;
  LocalDateTime when;
}
