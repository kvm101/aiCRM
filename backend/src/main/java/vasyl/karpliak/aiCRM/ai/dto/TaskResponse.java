package vasyl.karpliak.aiCRM.ai.dto;

import java.time.LocalDateTime;

public record TaskResponse(
    Long id,
    String title,
    String description,
    LocalDateTime deadline,
    String tag,
    Long dealId,
    String dealTitle,
    Long clientId,
    String clientName,
    String type,
    LocalDateTime dueDate,
    String result) {}
