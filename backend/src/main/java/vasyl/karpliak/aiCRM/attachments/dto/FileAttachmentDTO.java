package vasyl.karpliak.aiCRM.attachments.dto;

import java.time.LocalDateTime;
import vasyl.karpliak.aiCRM.attachments.enums.FileAttachmentStatus;

public record FileAttachmentDTO(
    Long id,
    String originalFilename,
    String contentType,
    long fileSizeBytes,
    FileAttachmentStatus status,
    Long projectId,
    Long dealEventId,
    Long taskId,
    Long clientId,
    Integer clientNoteIndex,
    String processingError,
    LocalDateTime createdAt) {}
