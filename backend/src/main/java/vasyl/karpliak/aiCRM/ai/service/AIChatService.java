package vasyl.karpliak.aiCRM.ai.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.ai.dto.ChatRequest;

@Service
public class AIChatService {

  private final AiOrchestrator orchestrator;

  public AIChatService(AiOrchestrator orchestrator) {
    this.orchestrator = orchestrator;
  }

  public String generateReply(
      String userMessage,
      Long currentUserId,
      List<ChatRequest.HistoryMessage> history,
      String modelProvider) {

    String systemPrompt =
        "Ти - корисний AI-асистент в системі CRM. "
            + "Зараз ти спілкуєшся з користувачем, ID якого: "
            + currentUserId
            + ". "
            + "Використовуй цей ID, коли викликаєш функції для отримання даних користувача. "
            + "Відповідай тією мовою, якою тебе питають. "
            + "CRITICAL RULES: "
            + "1) You MUST use the native tool/function calling mechanism. NEVER print raw JSON function calls as text in your response. "
            + "2) NEVER output XML tags like <function=...>. "
            + "3) If you want to call a tool, use the tool call API — do NOT write {\"type\": \"function\", ...} as text. "
            + "4) After tool results come back, summarize what was done in natural language for the user.";

    // Конвертуємо DTO-історію у Spring AI Message об'єкти
    List<Message> conversationHistory = new ArrayList<>();
    if (history != null) {
      for (ChatRequest.HistoryMessage h : history) {
        if ("user".equals(h.role())) {
          conversationHistory.add(new UserMessage(h.content()));
        } else if ("ai".equals(h.role())) {
          conversationHistory.add(new AssistantMessage(h.content()));
        }
      }
    }

    return orchestrator.generateWithFallback(
        systemPrompt, userMessage, conversationHistory, modelProvider);
  }
}
