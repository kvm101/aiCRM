package vasyl.karpliak.aiCRM.reporting.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.reporting.domain.ReportTask;
import vasyl.karpliak.aiCRM.reporting.enums.ReportStatus;
import vasyl.karpliak.aiCRM.reporting.repository.ReportTaskRepository;
import vasyl.karpliak.aiCRM.shared.context.RequestContextHelper;

import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/reports")
public class ReportDownloadController {

    private final ReportTaskRepository reportTaskRepository;

    public ReportDownloadController(ReportTaskRepository reportTaskRepository) {
        this.reportTaskRepository = reportTaskRepository;
    }

    private Long resolveProjectId(String projectIdHeader) {
        if (projectIdHeader != null && !projectIdHeader.isBlank()) {
            return Long.parseLong(projectIdHeader);
        }
        return RequestContextHelper.getCurrentProjectId();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable String id,
            @RequestHeader(name = "X-Project-Id", required = false) String projectId) {
        Long pid = resolveProjectId(projectId);
        ReportTask task = reportTaskRepository.findByIdAndProjectId(id, pid)
                .orElseThrow(() -> new RuntimeException("Звіт не знайдено"));

        if (task.getStatus() != ReportStatus.COMPLETED || task.getFilePath() == null) {
            throw new RuntimeException("Файл звіту ще не готовий");
        }

        Path path = Path.of(task.getFilePath());
        if (!Files.exists(path)) {
            throw new RuntimeException("Файл звіту відсутній на диску");
        }

        FileSystemResource resource = new FileSystemResource(path);
        String filename = path.getFileName().toString();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}
