package vasyl.karpliak.aiCRM.sales.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.sales.domain.DealEvent;

import java.util.List;

@Repository
public interface DealEventRepository extends JpaRepository<DealEvent, Long> {
    List<DealEvent> findByDealIdOrderByCreatedAtAsc(Long dealId);
}
