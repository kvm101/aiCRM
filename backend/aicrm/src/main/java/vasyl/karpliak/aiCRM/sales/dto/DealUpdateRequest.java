package vasyl.karpliak.aiCRM.sales.dto;

import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import java.math.BigDecimal;

public record DealUpdateRequest(
        String title,
        BigDecimal budget,
        String currency,
        DealStatus status
) {}
