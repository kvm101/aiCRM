package vasyl.karpliak.aiCRM.communications.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vasyl.karpliak.aiCRM.communications.adapter.ChannelAdapter;
import vasyl.karpliak.aiCRM.communications.config.RabbitMQConfig;
import vasyl.karpliak.aiCRM.communications.domain.Bot;
import vasyl.karpliak.aiCRM.communications.dto.UnifiedMessage;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;
import vasyl.karpliak.aiCRM.communications.repository.BotRepository;
import vasyl.karpliak.aiCRM.communications.repository.ChatSessionRepository;
import vasyl.karpliak.aiCRM.communications.repository.MessageRepository;

@Service
public class MessageOutboundListener {

  private final BotRepository botRepository;
  private final ChatSessionRepository chatSessionRepository;
  private final MessageRepository messageRepository;
  private final Map<ChannelType, ChannelAdapter> adapters;

  public MessageOutboundListener(
      BotRepository botRepository,
      ChatSessionRepository chatSessionRepository,
      MessageRepository messageRepository,
      List<ChannelAdapter> channelAdapters) {
    this.botRepository = botRepository;
    this.chatSessionRepository = chatSessionRepository;
    this.messageRepository = messageRepository;

    // Магія Spring: збираємо всі реалізації ChannelAdapter у мапу за ChannelType.
    // Це дозволяє динамічно вибирати потрібний адаптер (Telegram, Viber, Email) O(1).
    this.adapters =
        channelAdapters.stream()
            .collect(Collectors.toMap(ChannelAdapter::getChannelType, adapter -> adapter));
  }

  @Transactional
  @RabbitListener(queues = RabbitMQConfig.OUTBOUND_QUEUE)
  public void processOutboundMessage(UnifiedMessage unifiedMessage) {
    ChannelAdapter adapter = adapters.get(unifiedMessage.channel());

    if (adapter == null) {
      throw new IllegalArgumentException(
          "Не знайдено адаптер для каналу: " + unifiedMessage.channel());
    }

    // Шукаємо токен бота для цієї команди та каналу
    Optional<Bot> optionalBot =
        botRepository.findByTeamIdAndChannelType(unifiedMessage.teamId(), unifiedMessage.channel());

    if (optionalBot.isEmpty()) {
      throw new IllegalStateException(
          "Бота не знайдено для team: "
              + unifiedMessage.teamId()
              + " та каналу: "
              + unifiedMessage.channel());
    }

    String botToken = optionalBot.get().getBotToken();

    // 1. Відправляємо повідомлення в зовнішній світ (Facebook Messenger, Email тощо)
    adapter.sendMessage(unifiedMessage.externalChatId(), unifiedMessage.text(), botToken);

    // Повідомлення вже збережено в БД тим сервісом, який його відправив (напр. ChatController)
  }
}
