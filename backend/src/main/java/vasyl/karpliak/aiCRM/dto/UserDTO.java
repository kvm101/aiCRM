package vasyl.karpliak.aiCRM.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.dto.clientDTO.ClientDTO;
import vasyl.karpliak.aiCRM.dto.clientDTO.TaskDTO;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private String name;
    private String login;
    private String company;
    private String email;
    private String phone;
    private LocalDateTime lastEnter;  // camelCase
    private List<TaskDTO> tasks;
    private List<ClientDTO> clients;
}
