package vasyl.karpliak.aiCRM.communications.dto;

import java.time.LocalDateTime;

public record EmailMessageDto(
    Long id,
    String sender,
    String recipient,
    String subject,
    String body,
    String folder,
    boolean isRead,
    LocalDateTime timestamp) {}
