package vasyl.karpliak.aiCRM.shared.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import vasyl.karpliak.aiCRM.communications.domain.Bot;
import vasyl.karpliak.aiCRM.communications.enums.ChannelType;
import vasyl.karpliak.aiCRM.communications.repository.BotRepository;

@Component
public class BotSetupRunner implements CommandLineRunner {

  private final BotRepository botRepository;

  public BotSetupRunner(BotRepository botRepository) {
    this.botRepository = botRepository;
  }

  @Override
  public void run(String... args) {
    // 1. Створюємо або оновлюємо Facebook сторінку / бота
    Bot bot = botRepository.findByTeamIdAndChannelType(1L, ChannelType.FACEBOOK).orElse(new Bot());

    bot.setTeamId(1L);
    bot.setChannelType(ChannelType.FACEBOOK);
    bot.setBotToken("FACEBOOK_PAGE_ACCESS_TOKEN_PLACEHOLDER");

    botRepository.save(bot);
    System.out.println("✅ Facebook сторінку успішно збережено в базу!");
  }
}
