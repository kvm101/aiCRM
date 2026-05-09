package vasyl.karpliak.aiCRM.analytics.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vasyl.karpliak.aiCRM.analytics.service.AnalyticsService;

import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    private Long getUserId(String userIdStr) {
        return Long.parseLong(userIdStr);
    }

    @GetMapping("/funnel")
    public ResponseEntity<Map<String, Long>> getFunnel(@RequestHeader(name = "X-User-Id") String userId) {
        return ResponseEntity.ok(analyticsService.getFunnel(getUserId(userId)));
    }

    @GetMapping("/goals")
    public ResponseEntity<Map<String, Object>> getGoals(@RequestHeader(name = "X-User-Id", defaultValue = "1") String userId) {
        return ResponseEntity.ok(analyticsService.getGoals(getUserId(userId)));
    }

    @org.springframework.web.bind.annotation.PutMapping("/goals")
    public ResponseEntity<Map<String, Object>> updateGoals(
            @RequestHeader(name = "X-User-Id", defaultValue = "1") String userId,
            @org.springframework.web.bind.annotation.RequestBody Map<String, String> payload) {
        
        java.math.BigDecimal targetRevenue = payload.containsKey("targetRevenue") ? 
            new java.math.BigDecimal(payload.get("targetRevenue")) : null;
        String currency = payload.get("currency");
        
        return ResponseEntity.ok(analyticsService.updateGoals(getUserId(userId), targetRevenue, currency));
    }
}
