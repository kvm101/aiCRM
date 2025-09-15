package vasyl.karpliak.aiCRM.domain.client_domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.domain.User;

import java.time.LocalDateTime;


@Entity
@Table(name = "task")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    Long Id;
    String title;
    String description;
    LocalDateTime deadline;
}
