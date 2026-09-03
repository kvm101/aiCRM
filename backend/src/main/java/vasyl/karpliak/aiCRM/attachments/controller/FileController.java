package vasyl.karpliak.aiCRM.attachments.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vasyl.karpliak.aiCRM.attachments.domain.FileAttachment;
import vasyl.karpliak.aiCRM.attachments.dto.FileAttachmentDTO;
import vasyl.karpliak.aiCRM.attachments.repository.FileAttachmentRepository;
import vasyl.karpliak.aiCRM.attachments.service.FileAttachmentService;
import vasyl.karpliak.aiCRM.shared.context.RequestContextHelper;

@RestController
@RequestMapping("/files")
public class FileController {

  private final FileAttachmentService fileAttachmentService;
  private final FileAttachmentRepository fileAttachmentRepository;

  public FileController(
      FileAttachmentService fileAttachmentService,
      FileAttachmentRepository fileAttachmentRepository) {
    this.fileAttachmentService = fileAttachmentService;
    this.fileAttachmentRepository = fileAttachmentRepository;
  }

  private Long resolveProjectId(String projectIdHeader) {
    if (projectIdHeader != null && !projectIdHeader.isBlank()) {
      return Long.parseLong(projectIdHeader);
    }
    return RequestContextHelper.getCurrentProjectId();
  }

  @GetMapping
  public ResponseEntity<List<FileAttachmentDTO>> list(
      @RequestHeader(name = "X-Project-Id", required = false) String projectId) {
    return ResponseEntity.ok(fileAttachmentService.listForProject(resolveProjectId(projectId)));
  }

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<FileAttachmentDTO> upload(
      @RequestPart("file") MultipartFile file,
      @RequestParam(required = false) Long dealEventId,
      @RequestParam(required = false) Long taskId,
      @RequestParam(required = false) Long clientId,
      @RequestParam(required = false) Integer clientNoteIndex,
      @RequestHeader(name = "X-Project-Id", required = false) String projectId)
      throws IOException {
    return ResponseEntity.ok(
        fileAttachmentService.upload(
            file, resolveProjectId(projectId), dealEventId, taskId, clientId, clientNoteIndex));
  }

  @GetMapping("/{id}/download")
  public ResponseEntity<Resource> download(
      @PathVariable Long id,
      @RequestHeader(name = "X-Project-Id", required = false) String projectIdHeader)
      throws IOException {
    Long projectId = resolveProjectId(projectIdHeader);
    FileAttachment attachment =
        fileAttachmentRepository
            .findByIdAndProjectId(id, projectId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл не знайдено"));

    Path path = Path.of(attachment.getStoredPath());
    if (!Files.exists(path)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл відсутній на диску");
    }

    FileSystemResource resource = new FileSystemResource(path);
    Path fileNamePath = path.getFileName();
    String filename =
        fileNamePath != null
            ? fileNamePath.toString()
            : (StringUtils.hasText(attachment.getOriginalFilename())
                ? attachment.getOriginalFilename()
                : "file");
    MediaType mediaType = resolveDownloadMediaType(attachment.getContentType(), filename);

    return ResponseEntity.ok()
        .contentType(mediaType)
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + filename.replace("\"", "") + "\"")
        .body(resource);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @PathVariable Long id,
      @RequestHeader(name = "X-Project-Id", required = false) String projectIdHeader) {
    Long projectId = resolveProjectId(projectIdHeader);
    fileAttachmentService.delete(id, projectId);
    return ResponseEntity.noContent().build();
  }

  private static MediaType resolveDownloadMediaType(String storedContentType, String filename) {
    if (StringUtils.hasText(storedContentType)) {
      try {
        String ct = storedContentType.trim();
        int semi = ct.indexOf(';');
        if (semi > 0) {
          ct = ct.substring(0, semi).trim();
        }
        return MediaType.parseMediaType(ct);
      } catch (Exception ignored) {
        // fall through
      }
    }
    String lower = filename.toLowerCase();
    if (lower.endsWith(".pdf")) {
      return MediaType.APPLICATION_PDF;
    }
    if (lower.endsWith(".png")) {
      return MediaType.IMAGE_PNG;
    }
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      return MediaType.IMAGE_JPEG;
    }
    if (lower.endsWith(".csv")) {
      return MediaType.parseMediaType("text/csv");
    }
    return MediaType.APPLICATION_OCTET_STREAM;
  }
}
