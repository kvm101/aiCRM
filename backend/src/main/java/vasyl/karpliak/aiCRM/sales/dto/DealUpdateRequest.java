package vasyl.karpliak.aiCRM.sales.dto;

import java.math.BigDecimal;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;

public record DealUpdateRequest(
    String title, BigDecimal budget, String currency, DealStatus status) {}
