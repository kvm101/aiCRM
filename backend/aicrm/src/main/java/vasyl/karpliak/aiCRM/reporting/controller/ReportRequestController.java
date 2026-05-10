package vasyl.karpliak.aiCRM.reporting.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.reporting.dto.ReportRequestDTO;
import vasyl.karpliak.aiCRM.reporting.dto.ReportTaskDTO;
import vasyl.karpliak.aiCRM.reporting.service.ReportingService;
import vasyl.karpliak.aiCRM.shared.context.RequestContextHelper;

import java.util.List;

@RestController
@RequestMapping("/reports")
public class ReportRequestController {

    private final ReportingService reportingService;

    public ReportRequestController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    private Long resolveProjectId(String projectIdHeader) {
        if (projectIdHeader != null && !projectIdHeader.isBlank()) {
            return Long.parseLong(projectIdHeader);
        }
        return RequestContextHelper.getCurrentProjectId();
    }

    @PostMapping("/request")
    public ResponseEntity<ReportTaskDTO> requestReport(
            @RequestBody ReportRequestDTO request,
            @RequestHeader(name = "X-Project-Id", required = false) String projectId,
            @RequestHeader(name = "X-User-Id", required = false) String userId) {
        Long pid = resolveProjectId(projectId);
        Long uid = userId != null && !userId.isBlank() ? Long.parseLong(userId) : null;
        return ResponseEntity.ok(reportingService.requestReport(request, pid, uid));
    }

    @GetMapping
    public ResponseEntity<List<ReportTaskDTO>> listReports(
            @RequestHeader(name = "X-Project-Id", required = false) String projectId) {
        return ResponseEntity.ok(reportingService.getReportsForProject(resolveProjectId(projectId)));
    }
}
