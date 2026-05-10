package vasyl.karpliak.aiCRM.iam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.iam.domain.Project;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOrganizationId(Long organizationId);
}
