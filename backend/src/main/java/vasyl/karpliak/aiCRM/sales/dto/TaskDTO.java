package vasyl.karpliak.aiCRM.sales.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDTO {
  private Long id;
  private String title;
  private String description;
  private LocalDateTime deadline;
  private String tag;

  private Long dealId;
  private String dealTitle;
  private Long clientId;
  private String clientName;
  private String type;
  private LocalDateTime dueDate;
  private String result;
}
