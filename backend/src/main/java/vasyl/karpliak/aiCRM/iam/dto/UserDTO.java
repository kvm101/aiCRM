package vasyl.karpliak.aiCRM.iam.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.*;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.enums.UserRoles;
import vasyl.karpliak.aiCRM.sales.dto.TaskDTO;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Setter
public class UserDTO {
  private Long id;
  private String name;
  private String login;
  private String company;
  private String email;
  private String phone;
  private UserRoles role;
  private LocalDateTime lastEnter; // camelCase
  private boolean isGmailConnected;

  public static UserDTO toDTO(User user) {
    UserDTO dto = new UserDTO();
    dto.setId(user.getId());
    dto.setName(user.getName());
    dto.setLogin(user.getLogin());
    dto.setEmail(user.getEmail());
    dto.setRole(user.getRole());
    dto.setCompany(user.getCompany());
    dto.setPhone(user.getPhone());
    dto.setLastEnter(user.getLastEnter());
    dto.setGmailConnected(user.getGoogleAccessToken() != null);

    return dto;
  }
}
