package vasyl.karpliak.aiCRM.reporting.dto;

import vasyl.karpliak.aiCRM.reporting.enums.ReportType;

public record ReportRequestDTO(
        String name,
        ReportType type
) {}
