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
    List<Deal> findByUserId(Long userId);
    List<Deal> findByUserIdAndStatus(Long userId, vasyl.karpliak.aiCRM.sales.enums.DealStatus status);
    
    // Угоди за статусом у діапазоні дат (для місячної аналітики)
    List<Deal> findByUserIdAndStatusAndUpdatedAtBetween(
            Long userId, 
            vasyl.karpliak.aiCRM.sales.enums.DealStatus status,
            LocalDateTime from, 
            LocalDateTime to);
    
    long countByUserIdAndStatus(Long userId, vasyl.karpliak.aiCRM.sales.enums.DealStatus status);
    
    @Query("SELECT SUM(d.budget) FROM Deal d WHERE d.user.id = :userId AND d.status = :status")
    BigDecimal sumBudgetByUserIdAndStatus(@Param("userId") Long userId, @Param("status") vasyl.karpliak.aiCRM.sales.enums.DealStatus status);
}
