package vasyl.karpliak.aiCRM.repository.client_repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.domain.client_domain.Client;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
}
