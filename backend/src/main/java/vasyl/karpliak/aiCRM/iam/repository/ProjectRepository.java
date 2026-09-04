package vasyl.karpliak.aiCRM.iam.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.iam.domain.Project;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
  List<Project> findByOrganizationId(Long organizationId);
}
