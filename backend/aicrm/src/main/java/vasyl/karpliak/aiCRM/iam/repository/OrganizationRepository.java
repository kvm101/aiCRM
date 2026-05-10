package vasyl.karpliak.aiCRM.iam.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.iam.domain.Organization;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
}
