package vasyl.karpliak.aiCRM.communications.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import vasyl.karpliak.aiCRM.iam.domain.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_messages")
@Getter
@Setter
public class EmailMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String sender;
    private String recipient;
    private String subject;
    
    @Column(columnDefinition = "TEXT")
    private String body;
    
    private String folder; // INBOX, SENT, DRAFTS
    
    private boolean isRead;
    
    private LocalDateTime timestamp;
}
