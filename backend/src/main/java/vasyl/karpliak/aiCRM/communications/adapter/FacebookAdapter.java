package vasyl.karpliak.aiCRM.communications.adapter;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;

@Component
public class FacebookAdapter implements ChannelAdapter {

  private final RestTemplate restTemplate;
  private static final String FACEBOOK_API_URL = "https://graph.facebook.com/v20.0/me/messages";

  public FacebookAdapter() {
    this.restTemplate = new RestTemplate();
  }

  @Override
  public void sendMessage(String externalChatId, String text, String botToken) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    // Prepare the payload according to Facebook Messenger API
    Map<String, Object> payload = new HashMap<>();

    Map<String, String> recipient = new HashMap<>();
    recipient.put("id", externalChatId);
    payload.put("recipient", recipient);

    Map<String, String> message = new HashMap<>();
    message.put("text", text);
    payload.put("message", message);

    payload.put("messaging_type", "RESPONSE");

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

    String url = FACEBOOK_API_URL + "?access_token=" + botToken;

    try {
      restTemplate.exchange(url, HttpMethod.POST, request, String.class);
      System.out.println("Message sent successfully to Facebook user: " + externalChatId);
    } catch (Exception e) {
      System.err.println("Failed to send message to Facebook: " + e.getMessage());
      e.printStackTrace();
    }
  }

  @Override
  public ChannelType getChannelType() {
    return ChannelType.FACEBOOK;
  }
}
