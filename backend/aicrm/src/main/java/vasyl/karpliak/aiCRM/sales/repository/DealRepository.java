package vasyl.karpliak.aiCRM.sales.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.sales.domain.Deal;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DealRepository extends JpaRepository<Deal, Long> {
    List<Deal> findByProjectId(Long projectId);
    List<Deal> findByProjectIdAndStatus(Long projectId, vasyl.karpliak.aiCRM.sales.enums.DealStatus status);
    
    // Угоди за статусом у діапазоні дат (для місячної аналітики)
    List<Deal> findByProjectIdAndStatusAndUpdatedAtBetween(
            Long projectId, 
            vasyl.karpliak.aiCRM.sales.enums.DealStatus status,
            LocalDateTime from, 
            LocalDateTime to);
    
    long countByProjectIdAndStatus(Long projectId, vasyl.karpliak.aiCRM.sales.enums.DealStatus status);
    
    @Query("SELECT SUM(d.budget) FROM Deal d WHERE d.project.id = :projectId AND d.status = :status")
    BigDecimal sumBudgetByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") vasyl.karpliak.aiCRM.sales.enums.DealStatus status);
}
