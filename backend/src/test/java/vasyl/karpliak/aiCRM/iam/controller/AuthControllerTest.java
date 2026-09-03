package vasyl.karpliak.aiCRM.iam.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.dto.RegistrationDTO;
import vasyl.karpliak.aiCRM.iam.service.UserService;

@WebMvcTest(AuthController.class)
public class AuthControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private UserService userService;

  @Test
  void register_ShouldReturnOk() throws Exception {
    when(userService.createUser(any(RegistrationDTO.class))).thenReturn(new User());

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"login\":\"newuser\", \"password\":\"pass123\", \"name\":\"Test\"}"))
        .andExpect(status().isOk());
  }

  @Test
  void login_WithValidCredentials_ShouldReturnCookieAndOk() throws Exception {
    User user = new User();
    user.setId(10L);
    when(userService.getUserByLoginAndPassword("valid", "password")).thenReturn(Optional.of(user));

    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"login\":\"valid\", \"password\":\"password\"}"))
        .andExpect(status().isOk())
        .andExpect(cookie().exists("user_id"))
        .andExpect(cookie().value("user_id", "10"))
        .andExpect(content().string("Login successful"));
  }

  @Test
  void login_WithInvalidCredentials_ShouldReturnError() throws Exception {
    when(userService.getUserByLoginAndPassword("invalid", "wrong")).thenReturn(Optional.empty());

    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"login\":\"invalid\", \"password\":\"wrong\"}"))
        .andExpect(
            status().isOk()) // Controller returns 200 OK with body "Login is bad" using ofNullable
        .andExpect(content().string("Login is bad"));
  }

  @Test
  void logout_ShouldClearCookie() throws Exception {
    mockMvc
        .perform(post("/auth/logout"))
        .andExpect(status().isOk())
        .andExpect(cookie().exists("user_id"))
        .andExpect(cookie().value("user_id", ""))
        .andExpect(content().string("Logout successful"));
  }
}
