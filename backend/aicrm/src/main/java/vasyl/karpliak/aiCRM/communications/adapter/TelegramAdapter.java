package vasyl.karpliak.aiCRM.communications.adapter;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;

import java.util.HashMap;
import java.util.Map;

@Component
public class TelegramAdapter implements ChannelAdapter {

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public ChannelType getChannelType() {
        return ChannelType.TELEGRAM;
    }

    @Override
    public void sendMessage(String externalChatId, String text, String botToken) {
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("chat_id", externalChatId);
        payload.put("text", text);

        restTemplate.postForObject(url, payload, String.class);
    }
}
