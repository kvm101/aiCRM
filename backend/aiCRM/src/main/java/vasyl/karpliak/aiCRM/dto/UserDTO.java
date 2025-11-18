package vasyl.karpliak.aiCRM.dto;

import lombok.*;
import vasyl.karpliak.aiCRM.domain.User;
import vasyl.karpliak.aiCRM.dto.clientDTO.ClientDTO;
import vasyl.karpliak.aiCRM.dto.clientDTO.TaskDTO;
import vasyl.karpliak.aiCRM.enums.UserRoles;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Setter
public class UserDTO {
    private String name;
    private String login;
    private String company;
    private String email;
    private String phone;
    private UserRoles role;
    private LocalDateTime lastEnter;  // camelCase

    public static UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setName(user.getName());
        dto.setLogin(user.getLogin());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCompany(user.getCompany());
        dto.setPhone(user.getPhone());
        dto.setLastEnter(user.getLastEnter());


        List<TaskDTO> taskDTOs = user.getTasks().stream()
                .map(task -> {
                    TaskDTO t = new TaskDTO();
                    t.setId(task.getId());
                    t.setTitle(task.getTitle());
                    t.setDescription(task.getDescription());
                    t.setDeadline(task.getDeadline());
                    t.setTag(task.getTag());
                    return t;
                }).toList();

        return dto;
    }
}

