package vasyl.karpliak.aiCRM.reporting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vasyl.karpliak.aiCRM.reporting.domain.ReportTask;

import java.util.List;
import java.util.Optional;

public interface ReportTaskRepository extends JpaRepository<ReportTask, String> {
    List<ReportTask> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    Optional<ReportTask> findByIdAndProjectId(String id, Long projectId);
}
