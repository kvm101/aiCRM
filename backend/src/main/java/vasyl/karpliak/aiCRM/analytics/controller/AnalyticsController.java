package vasyl.karpliak.aiCRM.analytics.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vasyl.karpliak.aiCRM.analytics.service.AnalyticsService;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

  private final AnalyticsService analyticsService;

  public AnalyticsController(AnalyticsService analyticsService) {
    this.analyticsService = analyticsService;
  }

  private Long getProjectId(String projectIdStr) {
    if (projectIdStr == null || projectIdStr.isBlank()) {
      throw new RuntimeException("Project ID is missing");
    }
    return Long.parseLong(projectIdStr);
  }

  @GetMapping("/funnel")
  public ResponseEntity<Map<String, Long>> getFunnel(
      @RequestHeader(name = "X-Project-Id") String projectId) {
    return ResponseEntity.ok(analyticsService.getFunnel(getProjectId(projectId)));
  }

  @GetMapping("/goals")
  public ResponseEntity<Map<String, Object>> getGoals(
      @RequestHeader(name = "X-Project-Id") String projectId,
      @RequestHeader(name = "X-User-Id", defaultValue = "1") String userId) {
    return ResponseEntity.ok(
        analyticsService.getGoals(getProjectId(projectId), Long.parseLong(userId)));
  }

  @org.springframework.web.bind.annotation.PutMapping("/goals")
  public ResponseEntity<Map<String, Object>> updateGoals(
      @RequestHeader(name = "X-Project-Id") String projectId,
      @RequestHeader(name = "X-User-Id", defaultValue = "1") String userId,
      @org.springframework.web.bind.annotation.RequestBody Map<String, String> payload) {

    java.math.BigDecimal targetRevenue =
        payload.containsKey("targetRevenue")
            ? new java.math.BigDecimal(payload.get("targetRevenue"))
            : null;
    String currency = payload.get("currency");
    String targetPeriod = payload.get("targetPeriod");

    return ResponseEntity.ok(
        analyticsService.updateGoals(
            getProjectId(projectId),
            Long.parseLong(userId),
            targetRevenue,
            currency,
            targetPeriod));
  }
}
