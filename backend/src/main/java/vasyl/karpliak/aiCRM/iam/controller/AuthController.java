package vasyl.karpliak.aiCRM.iam.controller;

import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.dto.LoginDTO;
import vasyl.karpliak.aiCRM.iam.dto.RegistrationDTO;
import vasyl.karpliak.aiCRM.iam.service.UserService;

@RestController
@RequestMapping("/auth")
public class AuthController {

  public final UserService userService;

  public AuthController(UserService userService) {
    this.userService = userService;
  }

  @PostMapping("/register")
  public void register(@RequestBody RegistrationDTO user) {
    userService.createUser(user);
  }

  @PostMapping("/login")
  public ResponseEntity<String> login(@RequestBody LoginDTO loginDTO) {
    Optional<User> optionalUser =
        userService.getUserByLoginAndPassword(loginDTO.getLogin(), loginDTO.getPassword());

    if (optionalUser.isPresent()) {
      User user = optionalUser.get();

      ResponseCookie cookie =
          ResponseCookie.from("user_id", Long.toString(user.getId()))
              .path("/")
              .httpOnly(true)
              .maxAge(3600)
              .build();

      return ResponseEntity.ok()
          .header(HttpHeaders.SET_COOKIE, cookie.toString())
          .body("Login successful");

    } else {
      return ResponseEntity.ofNullable("Login is bad");
    }
  }

  @PostMapping("/logout")
  public ResponseEntity<String> logout() {
    ResponseCookie cookie = ResponseCookie.from("user_id", "").path("/").maxAge(0).build();
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, cookie.toString())
        .body("Logout successful");
  }
}
