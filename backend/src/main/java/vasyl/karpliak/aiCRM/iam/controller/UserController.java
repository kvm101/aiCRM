package vasyl.karpliak.aiCRM.iam.controller;

import java.util.List;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.dto.UserDTO;
import vasyl.karpliak.aiCRM.iam.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping("/{id}")
  public ResponseEntity<UserDTO> getUser(
      @RequestHeader(name = "X-User-Id") String user_id, @PathVariable Long id) {

    return userService
        .getUserById((id != null) ? id : Long.parseLong(user_id))
        .map(UserDTO::toDTO)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/me")
  public ResponseEntity<UserDTO> getMe(
      @CookieValue(name = "user_id", required = false) String userId) {
    if (userId == null || userId.isEmpty()) {
      return ResponseEntity.status(401).build();
    }
    return userService
        .getUserById(Long.parseLong(userId))
        .map(UserDTO::toDTO)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.status(401).build());
  }

  @GetMapping("/filtered")
  public ResponseEntity<List<User>> listOfUsers(@RequestParam(required = false) String name) {
    List<User> users;
    if (name != null) {
      users =
          userService.getAllUsers().stream()
              .filter(u -> u.getName().equalsIgnoreCase(name))
              .toList();
    } else {
      users = userService.getAllUsers();
    }
    return ResponseEntity.ok(users);
  }

  @PutMapping("/{id}")
  public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
    Optional<User> existingUser = userService.getUserById(id);
    if (existingUser.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    User oldUser = existingUser.get();
    User updatedUser = userService.updateUser(oldUser, userDetails);
    return ResponseEntity.ok(updatedUser);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    Optional<User> user = userService.getUserById(id);
    if (user.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    userService.deleteUser(id);
    return ResponseEntity.noContent().build();
  }
}
