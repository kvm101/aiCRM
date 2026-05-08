package vasyl.karpliak.aiCRM.ai.dto;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        String senderType,
        String text,
        LocalDateTime createdAt
) {}
