package vasyl.karpliak.aiCRM.communications.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;
import vasyl.karpliak.aiCRM.communications.enums.SessionStatus;

@Entity
@Table(name = "chat_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_chat_id", nullable = false)
    private String externalChatId;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel_type", nullable = false)
    private ChannelType channelType;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "assigned_user_id")
    private Long assignedUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SessionStatus status;

    @Column(name = "unread_count", nullable = false)
    private int unreadCount = 0;
}
