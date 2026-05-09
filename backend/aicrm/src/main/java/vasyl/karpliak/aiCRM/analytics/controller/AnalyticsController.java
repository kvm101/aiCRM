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
    public ResponseEntity<Map<String, Object>> getGoals(@RequestHeader(name = "X-User-Id") String userId) {
        return ResponseEntity.ok(analyticsService.getGoals(getUserId(userId)));
    }
}
