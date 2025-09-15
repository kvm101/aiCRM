package vasyl.karpliak.aiCRM.dto.clientDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDTO {
    Long Id;
    String title;
    String description;
    LocalDateTime deadline;
}
