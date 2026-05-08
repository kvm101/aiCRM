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
        String myToken = "8779138875:AAFSstnaauIHb2dhK8Sgz2tvzQ2nGFWmlmU"; 
        
        Bot bot = botRepository.findByTeamIdAndChannelType(1L, ChannelType.TELEGRAM)
                .orElse(new Bot());
                
        bot.setTeamId(1L);
        bot.setChannelType(ChannelType.TELEGRAM);
        bot.setBotToken(myToken);
        botRepository.save(bot);
        
        System.out.println("✅ Telegram бот успішно збережено в базу!");
    }
}
