package vasyl.karpliak.aiCRM.iam.dto;

import lombok.Getter;
import lombok.Setter;
import vasyl.karpliak.aiCRM.iam.enums.UserRoles;

@Getter
@Setter
public class RegistrationDTO {
  private String name;
  private String login;
  private String password;
  private String company;
  private String email;
  private String phone;
  private UserRoles role;
}
