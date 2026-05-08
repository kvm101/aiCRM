package vasyl.karpliak.aiCRM.shared.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.communications.enums.SessionStatus;
import vasyl.karpliak.aiCRM.communications.repository.ChatSessionRepository;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;
import vasyl.karpliak.aiCRM.sales.repository.TaskRepository;

import java.util.HashMap;
import java.util.Map;

/**
 * Provides aggregated statistics for the Dashboard.
 * This endpoint is consumed by the Next.js BFF layer.
 */
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final ClientRepository clientRepository;
    private final TaskRepository taskRepository;
    private final ChatSessionRepository chatSessionRepository;

    public DashboardController(ClientRepository clientRepository,
                               TaskRepository taskRepository,
                               ChatSessionRepository chatSessionRepository) {
        this.clientRepository = clientRepository;
        this.taskRepository = taskRepository;
        this.chatSessionRepository = chatSessionRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalContacts = clientRepository.count();
        long totalTasks = taskRepository.count();
        long openChats = chatSessionRepository.countByStatus(SessionStatus.OPEN);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalContacts", totalContacts);
        stats.put("totalTasks", totalTasks);
        stats.put("openChats", openChats);

        return ResponseEntity.ok(stats);
    }
}
