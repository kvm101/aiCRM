package vasyl.karpliak.aiCRM.ai.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DealResponse(
        Long id,
        String title,
        BigDecimal budget,
        String currency,
        String status,
        Long clientId,
        String clientName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
