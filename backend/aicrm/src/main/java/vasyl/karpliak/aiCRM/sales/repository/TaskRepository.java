package vasyl.karpliak.aiCRM.sales.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vasyl.karpliak.aiCRM.sales.domain.Task;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByProjectIdAndDeadlineBefore(Long projectId, LocalDateTime deadline);

    Optional<Task> findByIdAndProjectId(Long taskId, Long projectId);
}
