package vasyl.karpliak.aiCRM.communications.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import vasyl.karpliak.aiCRM.sales.service.SalesIntegrationService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // uses application-test.yaml
public class FacebookWebhookControllerIT {

  @Autowired private MockMvc mockMvc;

  @MockBean private SalesIntegrationService salesIntegrationService;

  @Test
  void verifyWebhook_WithValidToken_ShouldReturnChallenge() throws Exception {
    mockMvc
        .perform(
            get("/api/webhooks/facebook")
                .param("hub.mode", "subscribe")
                .param("hub.verify_token", "test_verify_token")
                .param("hub.challenge", "1158201444"))
        .andExpect(status().isOk())
        .andExpect(content().string("1158201444"));
  }

  @Test
  void verifyWebhook_WithInvalidToken_ShouldReturnForbidden() throws Exception {
    mockMvc
        .perform(
            get("/api/webhooks/facebook")
                .param("hub.mode", "subscribe")
                .param("hub.verify_token", "wrong_token")
                .param("hub.challenge", "1158201444"))
        .andExpect(status().isForbidden());
  }

  @Test
  void receiveMessage_WithValidPayload_ShouldReturnOk() throws Exception {
    String payload =
        """
                {
                  "object": "page",
                  "entry": [
                    {
                      "messaging": [
                        {
                          "sender": { "id": "12345" },
                          "message": { "text": "Hello Facebook" }
                        }
                      ]
                    }
                  ]
                }
                """;

    mockMvc
        .perform(
            post("/api/webhooks/facebook").contentType(MediaType.APPLICATION_JSON).content(payload))
        .andExpect(status().isOk())
        .andExpect(content().string("EVENT_RECEIVED"));
  }
}
