package vasyl.karpliak.aiCRM.sales.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.sales.domain.DealEvent;

@Repository
public interface DealEventRepository extends JpaRepository<DealEvent, Long> {
  List<DealEvent> findByDealIdOrderByCreatedAtAsc(Long dealId);

  Optional<DealEvent> findByIdAndDeal_Project_Id(Long id, Long projectId);
}
