package vasyl.karpliak.aiCRM.dto;
import lombok.Getter;
import lombok.Setter;
import vasyl.karpliak.aiCRM.enums.UserRoles;

@Getter
public class RegistrationDTO {
    private String name;
    private String login;
    private String password;
    private String company;
    private String email;
    private String phone;
    private UserRoles role;
}
