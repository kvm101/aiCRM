package vasyl.karpliak.aiCRM.sales.dto;

import java.time.LocalDateTime;

public record DealEventDto(
        Long id,
        Long dealId,
        String eventType,
        String description,
        LocalDateTime createdAt
) {}
