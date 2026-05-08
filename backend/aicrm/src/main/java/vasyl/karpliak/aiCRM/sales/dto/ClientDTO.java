package vasyl.karpliak.aiCRM.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vasyl.karpliak.aiCRM.iam.dto.UserDTO;
import vasyl.karpliak.aiCRM.sales.enums.ClientStatus;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDTO {
    private String name;
    private String company;
    private String email;
    private String phone;
    private UserDTO currentManager;
    private ClientStatus status;
    private List<String> notes;
    private List<TaskDTO> tasks;
}
