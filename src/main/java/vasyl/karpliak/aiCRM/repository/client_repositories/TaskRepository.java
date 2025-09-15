package vasyl.karpliak.aiCRM.repository.client_repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import vasyl.karpliak.aiCRM.domain.client_domain.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {

}
