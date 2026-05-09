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

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final ClientRepository clientRepository;
    private final TaskRepository taskRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final DealRepository dealRepository;

    public DashboardController(ClientRepository clientRepository,
                               TaskRepository taskRepository,
                               ChatSessionRepository chatSessionRepository,
                               DealRepository dealRepository) {
        this.clientRepository = clientRepository;
        this.taskRepository = taskRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.dealRepository = dealRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestHeader(name = "X-User-Id", defaultValue = "1") String userIdStr) {
        
        Long userId = Long.parseLong(userIdStr);

        long totalContacts    = clientRepository.count();
        long totalTasks       = taskRepository.count();
        long openChats        = chatSessionRepository.countByStatus(SessionStatus.OPEN);
        long totalDeals       = dealRepository.count();
        long activeDeals      = dealRepository.countByUserIdAndStatus(userId, DealStatus.NEW) +
                                dealRepository.countByUserIdAndStatus(userId, DealStatus.QUALIFICATION) +
                                dealRepository.countByUserIdAndStatus(userId, DealStatus.DELIVERY);
        long wonDeals         = dealRepository.countByUserIdAndStatus(userId, DealStatus.DONE);

        // Сумуємо непрочитані повідомлення з unreadCount по всіх відкритих сесіях
        long unreadMessages = chatSessionRepository.findAll().stream()
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
