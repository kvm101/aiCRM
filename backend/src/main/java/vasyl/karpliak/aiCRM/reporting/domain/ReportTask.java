package vasyl.karpliak.aiCRM.reporting.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.reporting.enums.ReportStatus;
import vasyl.karpliak.aiCRM.reporting.enums.ReportType;

@Entity
@Table(name = "report_tasks")
@Data
@NoArgsConstructor
public class ReportTask {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ReportType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ReportStatus status = ReportStatus.PENDING;

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @Column(name = "requested_by_user_id")
  private Long requestedByUserId;

  @Column(name = "file_path")
  private String filePath;

  @Column(name = "error_message")
  private String errorMessage;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }
}
