package vasyl.karpliak.aiCRM.sales.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.sales.domain.Client;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByNameContainingIgnoreCase(String name);

    @EntityGraph(attributePaths = {"project", "notes"})
    List<Client> findByProjectId(Long projectId);

    @EntityGraph(attributePaths = {"project", "notes"})
    Optional<Client> findByIdAndProjectId(Long id, Long projectId);
}
