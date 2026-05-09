package vasyl.karpliak.aiCRM.analytics.service;

import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.repository.DealRepository;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class AnalyticsService {

    private final DealRepository dealRepository;

    public AnalyticsService(DealRepository dealRepository) {
        this.dealRepository = dealRepository;
    }

    public Map<String, Long> getFunnel(Long userId) {
        Map<String, Long> funnel = new HashMap<>();
        for (DealStatus status : DealStatus.values()) {
            funnel.put(status.name(), dealRepository.countByUserIdAndStatus(userId, status));
        }
        return funnel;
    }

    public Map<String, Object> getGoals(Long userId) {
        Map<String, Object> goals = new HashMap<>();
        BigDecimal totalRevenue = dealRepository.sumBudgetByUserIdAndStatus(userId, DealStatus.DONE);
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }
        goals.put("achievedRevenue", totalRevenue);
        // Тут можна додати логіку для отримання цілі (target goal) користувача
        goals.put("targetRevenue", new BigDecimal("50000.00")); // Hardcoded для прикладу
        return goals;
    }
}
