package vasyl.karpliak.aiCRM.iam.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.http.HttpStatusCode;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.domain.Task;
import vasyl.karpliak.aiCRM.iam.enums.UserRoles;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class User{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "login", nullable = false, unique = true)
    private String login;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "company", nullable = false)
    private String company;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRoles role;

    @Column(name = "target_revenue")
    private java.math.BigDecimal targetRevenue;

    @Column(name = "target_currency")
    private String targetCurrency;

    @Column(name = "last_enter", nullable = false)
    private LocalDateTime lastEnter;

    @Column(name = "google_email")
    private String googleEmail;

    @Column(name = "google_access_token", length = 2048)
    private String googleAccessToken;

    @Column(name = "google_refresh_token", length = 2048)
    private String googleRefreshToken;

    @Column(name = "google_token_expiry")
    private LocalDateTime googleTokenExpiry;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "task_user_id")  // створить колонку user_id у таблиці task
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "client_user_id")
    private List<Client> clients = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (lastEnter == null) {
            lastEnter = LocalDateTime.now();
        }
    }
}