package vasyl.karpliak.aiCRM.analytics.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.repository.DealRepository;

@Service
public class AnalyticsService {

  private final DealRepository dealRepository;
  private final UserRepository userRepository;

  public AnalyticsService(DealRepository dealRepository, UserRepository userRepository) {
    this.dealRepository = dealRepository;
    this.userRepository = userRepository;
  }

  public Map<String, Long> getFunnel(Long projectId) {
    Map<String, Long> funnel = new HashMap<>();
    for (DealStatus status : DealStatus.values()) {
      funnel.put(status.name(), dealRepository.countByProjectIdAndStatus(projectId, status));
    }
    return funnel;
  }

  public Map<String, Object> getGoals(Long projectId, Long userId) {
    Map<String, Object> goals = new HashMap<>();

    Optional<User> userOpt = userRepository.findById(userId);
    if (userOpt.isEmpty()) {
      goals.put("achievedRevenue", 0);
      goals.put("targetRevenue", 0);
      goals.put("currency", "USD");
      goals.put("targetPeriod", "MONTH");
      return goals;
    }

    User user = userOpt.get();
    BigDecimal targetRevenue =
        user.getTargetRevenue() != null ? user.getTargetRevenue() : new BigDecimal("50000.00");
    String targetCurrency = user.getTargetCurrency() != null ? user.getTargetCurrency() : "USD";
    String targetPeriod =
        user.getTargetPeriod() != null ? user.getTargetPeriod().toUpperCase() : "MONTH";

    // Визначення меж періоду (WEEK, MONTH, YEAR)
    java.time.LocalDateTime start;
    java.time.LocalDateTime end;
    if ("WEEK".equals(targetPeriod)) {
      start = java.time.LocalDate.now().with(java.time.DayOfWeek.MONDAY).atStartOfDay();
      end = start.plusDays(7);
    } else if ("YEAR".equals(targetPeriod)) {
      start = java.time.LocalDate.now().withDayOfYear(1).atStartOfDay();
      end = start.plusYears(1);
    } else {
      start = java.time.LocalDate.now().withDayOfMonth(1).atStartOfDay();
      end = start.plusMonths(1);
    }

    // Fetch DONE deals тільки за вибраний період
    List<Deal> doneDeals =
        dealRepository.findByProjectIdAndStatusAndUpdatedAtBetween(
            projectId, DealStatus.DONE, start, end);
    BigDecimal achievedRevenue = BigDecimal.ZERO;

    for (Deal deal : doneDeals) {
      if (deal.getBudget() != null) {
        achievedRevenue =
            achievedRevenue.add(
                convertToTargetCurrency(deal.getBudget(), deal.getCurrency(), targetCurrency));
      }
    }

    goals.put("achievedRevenue", achievedRevenue.setScale(2, RoundingMode.HALF_UP));
    goals.put("targetRevenue", targetRevenue.setScale(2, RoundingMode.HALF_UP));
    goals.put("currency", targetCurrency);
    goals.put("targetPeriod", targetPeriod);

    return goals;
  }

  public Map<String, Object> updateGoals(
      Long projectId, Long userId, BigDecimal targetRevenue, String currency, String targetPeriod) {
    Optional<User> userOpt = userRepository.findById(userId);
    if (userOpt.isPresent()) {
      User user = userOpt.get();
      user.setTargetRevenue(targetRevenue);
      user.setTargetCurrency(currency != null ? currency.toUpperCase() : "USD");
      user.setTargetPeriod(targetPeriod != null ? targetPeriod.toUpperCase() : "MONTH");
      userRepository.save(user);
    }
    return getGoals(projectId, userId);
  }

  // A simple hardcoded exchange rate converter for demonstration purposes.
  // In a real application, this should use a live exchange rate API.
  private BigDecimal convertToTargetCurrency(
      BigDecimal amount, String sourceCurrency, String targetCurrency) {
    if (sourceCurrency == null
        || targetCurrency == null
        || sourceCurrency.equalsIgnoreCase(targetCurrency)) {
      return amount;
    }

    // Base currency is USD
    BigDecimal amountInUsd = amount;
    switch (sourceCurrency.toUpperCase()) {
      case "UAH":
        amountInUsd = amount.divide(new BigDecimal("41.5"), 4, RoundingMode.HALF_UP);
        break;
      case "EUR":
        amountInUsd = amount.divide(new BigDecimal("0.95"), 4, RoundingMode.HALF_UP);
        break;
      case "GBP":
        amountInUsd = amount.divide(new BigDecimal("0.78"), 4, RoundingMode.HALF_UP);
        break;
      default:
        break;
    }

    BigDecimal convertedAmount = amountInUsd;
    switch (targetCurrency.toUpperCase()) {
      case "UAH":
        convertedAmount = amountInUsd.multiply(new BigDecimal("41.5"));
        break;
      case "EUR":
        convertedAmount = amountInUsd.multiply(new BigDecimal("0.95"));
        break;
      case "GBP":
        convertedAmount = amountInUsd.multiply(new BigDecimal("0.78"));
        break;
      default:
        break;
    }

    return convertedAmount;
  }
}
