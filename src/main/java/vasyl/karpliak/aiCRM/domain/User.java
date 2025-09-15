package vasyl.karpliak.aiCRM.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.domain.client_domain.Client;
import vasyl.karpliak.aiCRM.domain.client_domain.Task;
import vasyl.karpliak.aiCRM.enums.UserRoles;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    Long Id;
    String name;
    String login;
    String password;
    String company;
    String email;
    String phone;
    UserRoles role;
    LocalDateTime last_enter = LocalDateTime.now();
    List<Task> tasks;
    List<Client> clients;
}


