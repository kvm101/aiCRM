package vasyl.karpliak.aiCRM.domain;

import jakarta.persistence.*;
import lombok.*;
import vasyl.karpliak.aiCRM.domain.client_domain.Client;
import vasyl.karpliak.aiCRM.domain.client_domain.Task;
import vasyl.karpliak.aiCRM.enums.UserRoles;

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
public class User {



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

    @Column(name = "last_enter", nullable = false)
    private LocalDateTime lastEnter;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "user_id")  // створить колонку user_id у таблиці task
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "user_id")
    private List<Client> clients = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (lastEnter == null) {
            lastEnter = LocalDateTime.now();
        }
    }
}