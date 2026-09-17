package vasyl.karpliak.aiCRM.communications.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Placeholder integration tests for the Facebook Messenger webhook.
 *
 * <p>These tests verify that the placeholder endpoints return {@code 501 Not Implemented}. Replace
 * with real tests once Facebook Messenger integration is implemented.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FacebookWebhookControllerIT {

  @Autowired private MockMvc mockMvc;

  @Test
  void verifyWebhook_ShouldReturnNotImplemented() throws Exception {
    mockMvc.perform(get("/api/webhooks/facebook")).andExpect(status().isNotImplemented());
  }

  @Test
  void receiveMessage_ShouldReturnNotImplemented() throws Exception {
    mockMvc.perform(post("/api/webhooks/facebook")).andExpect(status().isNotImplemented());
  }
}
