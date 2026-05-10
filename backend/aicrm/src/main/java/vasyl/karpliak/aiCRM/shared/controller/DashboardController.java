package vasyl.karpliak.aiCRM.shared.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.communications.enums.SessionStatus;
import vasyl.karpliak.aiCRM.communications.repository.ChatSessionRepository;
import vasyl.karpliak.aiCRM.communications.repository.MessageRepository;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealRepository;
import vasyl.karpliak.aiCRM.sales.repository.TaskRepository;
import vasyl.karpliak.aiCRM.iam.repository.ProjectRepository;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final ClientRepository clientRepository;
    private final TaskRepository taskRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final DealRepository dealRepository;
    private final ProjectRepository projectRepository;

    public DashboardController(ClientRepository clientRepository,
                               TaskRepository taskRepository,
                               ChatSessionRepository chatSessionRepository,
                               DealRepository dealRepository,
                               ProjectRepository projectRepository) {
        this.clientRepository = clientRepository;
        this.taskRepository = taskRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.dealRepository = dealRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestHeader(name = "X-Project-Id", required = false) String projectIdStr) {
        
        // Fallback: if project_id cookie isn't set yet (e.g. server-side initial render),
        // use the first project available for the user's organization.
        Long projectId;
        if (projectIdStr == null || projectIdStr.isBlank()) {
            projectId = projectRepository.findAll().stream()
                    .findFirst()
                    .map(p -> p.getId())
                    .orElse(null);
        } else {
            projectId = Long.parseLong(projectIdStr);
        }

        if (projectId == null) {
            // No projects yet — return all zeros
            Map<String, Object> empty = new HashMap<>();
            empty.put("totalContacts", 0);
            empty.put("totalTasks", 0);
            empty.put("openChats", 0);
            empty.put("totalDeals", 0);
            empty.put("activeDeals", 0);
            empty.put("wonDeals", 0);
            empty.put("unreadMessages", 0);
            return ResponseEntity.ok(empty);
        }

        long totalContacts    = clientRepository.findByProjectId(projectId).size();
        long totalTasks       = taskRepository.findByProjectId(projectId).size();
        long openChats        = chatSessionRepository.countByStatusAndProjectId(SessionStatus.OPEN, projectId);
        long totalDeals       = dealRepository.findByProjectId(projectId).size();
        long activeDeals      = dealRepository.countByProjectIdAndStatus(projectId, DealStatus.NEW) +
                                dealRepository.countByProjectIdAndStatus(projectId, DealStatus.QUALIFICATION) +
                                dealRepository.countByProjectIdAndStatus(projectId, DealStatus.DELIVERY);
        long wonDeals         = dealRepository.countByProjectIdAndStatus(projectId, DealStatus.DONE);

        long unreadMessages = chatSessionRepository.findByProjectId(projectId).stream()
                .mapToLong(s -> s.getUnreadCount())
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalContacts", totalContacts);
        stats.put("totalTasks", totalTasks);
        stats.put("openChats", openChats);
        stats.put("totalDeals", totalDeals);
        stats.put("activeDeals", activeDeals);
        stats.put("wonDeals", wonDeals);
        stats.put("unreadMessages", unreadMessages);

        return ResponseEntity.ok(stats);
    }
}
