package vasyl.karpliak.aiCRM.sales.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/reporting")
public class ReportingController {

    // Simple mock DTO for reporting
    public static class ReportRequest {
        public String name;
        public String type;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateReport(
            @RequestBody ReportRequest request,
            @RequestHeader(name = "X-User-Id") String userId) {

        // This simulates a complex backend report generation logic
        // For now, it returns mock data formatted similarly to what the frontend BFF expects
        Map<String, Object> response = new HashMap<>();
        response.put("reportId", "rep_" + UUID.randomUUID().toString().substring(0, 8));
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("generatedAt", LocalDateTime.now().toString());
        metadata.put("requestedBy", userId);
        response.put("metadata", metadata);
        
        List<Map<String, Object>> metrics = new ArrayList<>();
        metrics.add(Map.of("period", "Week 1", "value", 1200));
        metrics.add(Map.of("period", "Week 2", "value", 1450));
        metrics.add(Map.of("period", "Week 3", "value", 1100));
        metrics.add(Map.of("period", "Week 4", "value", 1800));
        response.put("metrics", metrics);

        return ResponseEntity.ok(response);
    }
}
