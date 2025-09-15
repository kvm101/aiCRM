package vasyl.karpliak.aiCRM.dto.clientDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.domain.User;
import vasyl.karpliak.aiCRM.domain.client_domain.Task;
import vasyl.karpliak.aiCRM.enums.ClientStatus;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDTO {
    String name;
    String company;
    String email;
    String phone;
    User current_manager;
    ClientStatus status;
    List<String> notes;
    List<Task> tasks;


}
