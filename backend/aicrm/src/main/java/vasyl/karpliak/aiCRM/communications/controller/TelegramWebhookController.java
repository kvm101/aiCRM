package vasyl.karpliak.aiCRM.communications.controller;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.communications.config.RabbitMQConfig;
import vasyl.karpliak.aiCRM.communications.dto.UnifiedMessage;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;
import vasyl.karpliak.aiCRM.communications.enums.SenderType;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@RestController
@RequestMapping("/webhooks/telegram")
public class TelegramWebhookController {

    private final RabbitTemplate rabbitTemplate;

    public TelegramWebhookController(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @PostMapping("/{teamId}")
    public ResponseEntity<Void> handleTelegramWebhook(@PathVariable Long teamId, @RequestBody JsonNode update) {
        // Ми використовуємо JsonNode, щоб не створювати громіздкі DTO для Telegram API
        if (update.has("message")) {
            JsonNode messageNode = update.get("message");
            
            String messageId = String.valueOf(messageNode.get("message_id").asLong());
            String chatId = String.valueOf(messageNode.get("chat").get("id").asLong());
            String text = messageNode.has("text") ? messageNode.get("text").asText() : "";
            
            long dateUnix = messageNode.get("date").asLong();
            LocalDateTime timestamp = LocalDateTime.ofInstant(Instant.ofEpochSecond(dateUnix), ZoneId.systemDefault());

            UnifiedMessage unifiedMessage = new UnifiedMessage(
                    messageId,
                    chatId,
                    ChannelType.TELEGRAM,
                    teamId,
                    text,
                    SenderType.CLIENT,
                    timestamp
            );

            // Пушимо в RabbitMQ (роутинг ключ відповідає назві черги)
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.INBOUND_QUEUE, unifiedMessage);
        }

        // Завжди повертаємо 200 OK, щоб Telegram не дублював вебхуки
        return ResponseEntity.ok().build(); 
    }
}
