package vasyl.karpliak.aiCRM.reporting.dto;

import vasyl.karpliak.aiCRM.reporting.enums.ReportStatus;
import vasyl.karpliak.aiCRM.reporting.enums.ReportType;

import java.time.LocalDateTime;

public record ReportTaskDTO(
        String id,
        String name,
        ReportType type,
        ReportStatus status,
        Long projectId,
        Long requestedByUserId,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        boolean downloadable,
        String downloadUrl
) {}
