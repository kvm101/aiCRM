package vasyl.karpliak.aiCRM.communications.service;

import org.springframework.context.ApplicationEvent;

public class NewNotificationEvent extends ApplicationEvent {

    private final Long notificationId;
    private final Long userId;
    private final String title;
    private final String message;

    public NewNotificationEvent(Object source, Long notificationId, Long userId, String title, String message) {
        super(source);
        this.notificationId = notificationId;
        this.userId = userId;
        this.title = title;
        this.message = message;
    }

    public Long getNotificationId() { return notificationId; }
    public Long getUserId() { return userId; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
}
