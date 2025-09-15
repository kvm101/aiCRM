package vasyl.karpliak.aiCRM.domain.client_domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.enums.ClientStatus;

import java.util.List;

@Entity
@Table(name = "client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Client {
    Long Id;
    String name;
    String company;
    String email;
    String phone;
    ClientStatus status;
    List<String> notes;
    List<Task> tasks;
}
