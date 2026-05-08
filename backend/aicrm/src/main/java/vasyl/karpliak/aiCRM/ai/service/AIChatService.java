package vasyl.karpliak.aiCRM.ai.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AIChatService {

    private final ChatClient chatClient;
    private final vasyl.karpliak.aiCRM.ai.tools.SalesAITools salesAITools;
    private final vasyl.karpliak.aiCRM.ai.tools.CommunicationsAITools communicationsAITools;

    public AIChatService(ChatClient.Builder chatClientBuilder, 
                         vasyl.karpliak.aiCRM.ai.tools.SalesAITools salesAITools,
                         vasyl.karpliak.aiCRM.ai.tools.CommunicationsAITools communicationsAITools) {
        this.chatClient = chatClientBuilder.build();
        this.salesAITools = salesAITools;
        this.communicationsAITools = communicationsAITools;
    }

    public String generateReply(String userMessage, Long currentUserId) {
        String systemPrompt = "Ти - корисний AI-асистент в системі CRM. " +
                              "Зараз ти спілкуєшся з користувачем, ID якого: " + currentUserId + ". " +
                              "Використовуй цей ID, коли викликаєш функції для отримання даних користувача.";

        return chatClient.prompt()
                .system(systemPrompt)
                .user(userMessage)
                .tools(salesAITools, communicationsAITools) // Передаємо обидва набори інструментів!
                .call()
                .content();
    }
}
