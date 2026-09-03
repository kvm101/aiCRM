package vasyl.karpliak.aiCRM.attachments.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.attachments.enums.FileAttachmentStatus;
import vasyl.karpliak.aiCRM.sales.domain.DealEvent;
import vasyl.karpliak.aiCRM.sales.domain.Task;

@Entity
@Table(name = "file_attachments")
@Data
@NoArgsConstructor
public class FileAttachment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "original_filename", nullable = false)
  private String originalFilename;

  @Column(name = "content_type")
  private String contentType;

  @Column(name = "file_size_bytes", nullable = false)
  private long fileSizeBytes;

  @Column(name = "stored_path", nullable = false, length = 1024)
  private String storedPath;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private FileAttachmentStatus status = FileAttachmentStatus.PENDING;

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "deal_event_id")
  private DealEvent dealEvent;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "task_id")
  private Task task;

  @Column(name = "client_id")
  private Long clientId;

  @Column(name = "client_note_index")
  private Integer clientNoteIndex;

  @Column(name = "processing_error", length = 2000)
  private String processingError;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }
}
