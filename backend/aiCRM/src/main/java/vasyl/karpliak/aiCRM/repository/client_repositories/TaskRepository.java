package vasyl.karpliak.aiCRM.repository.client_repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import vasyl.karpliak.aiCRM.domain.client_domain.Task;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserId(Long userId);

    List<Task> findByUserIdAndDeadlineBefore(Long userId, LocalDateTime deadline);

    Optional<Task> findByIdAndUserId(Long taskId, Long userId);
}
