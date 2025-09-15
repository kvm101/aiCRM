package vasyl.karpliak.aiCRM.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.dto.clientDTO.TaskDTO;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDTO {
    String name;
    String login;
    String company;
    String email;
    String phone;
    LocalDateTime last_enter = LocalDateTime.now();
    List<TaskDTO> tasks;
    List<vasyl.karpliak.aiCRM.dto.clientDTO.ClientDTO> clients;
}
