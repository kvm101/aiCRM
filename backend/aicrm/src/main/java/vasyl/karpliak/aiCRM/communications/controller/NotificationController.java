package vasyl.karpliak.aiCRM.communications.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.communications.domain.Notification;
import vasyl.karpliak.aiCRM.communications.dto.NotificationDto;
import vasyl.karpliak.aiCRM.communications.repository.NotificationRepository;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    private Long getUserId(String userIdStr) {
        return Long.parseLong(userIdStr);
    }

    private NotificationDto mapToDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt()
        );
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getUserNotifications(
            @RequestHeader(name = "X-User-Id", required = false) String userId) {
        if (userId == null) return ResponseEntity.ok(List.of());
        List<NotificationDto> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(getUserId(userId))
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications(
            @RequestHeader(name = "X-User-Id", required = false) String userId) {
        if (userId == null) return ResponseEntity.ok(List.of());
        List<NotificationDto> notifications = notificationRepository.findByUserIdAndReadFalse(getUserId(userId))
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(notifications);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, 
                                           @RequestHeader(name = "X-User-Id", required = false) String userId) {
        if (userId == null) return ResponseEntity.badRequest().build();
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUser().getId().equals(getUserId(userId))) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestHeader(name = "X-User-Id", required = false) String userId) {
        if (userId == null) return ResponseEntity.badRequest().build();
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(getUserId(userId));
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok().build();
    }
}
