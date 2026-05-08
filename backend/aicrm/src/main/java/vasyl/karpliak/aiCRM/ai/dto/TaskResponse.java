package vasyl.karpliak.aiCRM.ai.dto;

import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        String title,
        String description,
        LocalDateTime deadline,
        String tag
) {}
