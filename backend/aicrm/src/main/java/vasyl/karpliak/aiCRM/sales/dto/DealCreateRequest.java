package vasyl.karpliak.aiCRM.sales.dto;

import java.math.BigDecimal;

public record DealCreateRequest(
        String title,
        BigDecimal budget,
        String currency,
        Long clientId
) {}
