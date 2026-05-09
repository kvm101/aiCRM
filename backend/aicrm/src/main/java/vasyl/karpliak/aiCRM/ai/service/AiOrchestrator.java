package vasyl.karpliak.aiCRM.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.ai.tools.CommunicationsAITools;
import vasyl.karpliak.aiCRM.ai.tools.SalesAITools;

import java.util.List;

/**
 * AiOrchestrator — реалізує стратегію Gemini -> GitHub -> Mistral -> Groq з автоматичним fallback.
 */
@Service
public class AiOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(AiOrchestrator.class);

    private final GoogleGenAiChatModel geminiModel;
    private final OpenAiChatModel groqModel;
    private final OpenAiChatModel githubModel;
    private final OpenAiChatModel mistralModel;
    
    private final SalesAITools salesAITools;
    private final CommunicationsAITools communicationsAITools;

    @Autowired
    public AiOrchestrator(
            GoogleGenAiChatModel geminiModel,
            @Qualifier("groqModel") OpenAiChatModel groqModel,
            @Qualifier("githubModel") OpenAiChatModel githubModel,
            @Qualifier("mistralModel") OpenAiChatModel mistralModel,
            SalesAITools salesAITools,
            CommunicationsAITools communicationsAITools) {
        this.geminiModel = geminiModel;
        this.groqModel = groqModel;
        this.githubModel = githubModel;
        this.mistralModel = mistralModel;
        this.salesAITools = salesAITools;
        this.communicationsAITools = communicationsAITools;
    }

    public String generateWithFallback(String systemPrompt,
                                       String userMessage,
                                       List<Message> conversationHistory,
                                       String modelProvider) {

        String provider = (modelProvider == null || modelProvider.isBlank()) ? "auto" : modelProvider.toLowerCase();

        // Експліцитний вибір
        if ("gemini".equals(provider)) {
            return tryCall(geminiModel, "Gemini", systemPrompt, userMessage, conversationHistory);
        } else if ("github".equals(provider)) {
            return tryCall(githubModel, "GitHub", systemPrompt, userMessage, conversationHistory);
        } else if ("mistral".equals(provider)) {
            return tryCall(mistralModel, "Mistral", systemPrompt, userMessage, conversationHistory);
        } else if ("groq".equals(provider)) {
            return tryCall(groqModel, "Groq", systemPrompt, userMessage, conversationHistory);
        }

        // AUTO: Gemini -> GitHub -> Mistral -> Groq
        log.info("[AI] Using Auto fallback strategy");
        
        try {
            log.info("[AI] Attempting Gemini (primary)");
            return callWithChatClient(geminiModel, systemPrompt, userMessage, conversationHistory);
        } catch (Exception e) {
            log.error("[AI] Model Gemini failed: {}", e.getMessage());
        }

        try {
            log.info("[AI] Attempting GitHub Models (fallback 1)");
            return callWithChatClient(githubModel, systemPrompt, userMessage, conversationHistory);
        } catch (Exception e) {
            log.error("[AI] Model GitHub failed: {}", e.getMessage());
        }

        if (mistralModel != null) {
            try {
                log.info("[AI] Attempting Mistral (fallback 2)");
                return callWithChatClient(mistralModel, systemPrompt, userMessage, conversationHistory);
            } catch (Exception e) {
                log.error("[AI] Model Mistral failed: {}", e.getMessage());
            }
        }

        try {
            log.info("[AI] Attempting Groq (fallback 3)");
            return callWithChatClient(groqModel, systemPrompt, userMessage, conversationHistory);
        } catch (Exception e) {
            log.error("[AI] Model Groq failed: {}", e.getMessage());
        }

        return "⚠️ Всі AI-провайдери наразі недоступні або API-ключі не налаштовано. " +
               "Спробуйте пізніше або зверніться до адміністратора.";
    }

    private String tryCall(ChatModel model, String providerName, String systemPrompt,
                           String userMessage, List<Message> conversationHistory) {
        if (model == null) {
            return "⚠️ **" + providerName + "** не налаштовано в конфігурації.";
        }
        log.info("[AI] User explicitly selected {}", providerName);
        try {
            return callWithChatClient(model, systemPrompt, userMessage, conversationHistory);
        } catch (Exception e) {
            log.error("[AI] {} failed: {}", providerName, extractReason(e));
            return formatProviderError(providerName, e);
        }
    }

    // ─── Уніфікований виклик через ChatClient (з інструментами) ──────────────
    private String callWithChatClient(ChatModel model, String systemPrompt,
                                       String userMessage, List<Message> history) {
        var chatClient = org.springframework.ai.chat.client.ChatClient
                .builder(model)
                .build();

        return chatClient.prompt()
                .system(systemPrompt)
                .messages(history)
                .user(userMessage)
                .tools(salesAITools, communicationsAITools)
                .call()
                .content();
    }

    private String extractReason(Exception e) {
        if (e.getMessage() == null) return "unknown error";
        String msg = e.getMessage();
        if (msg.contains("429")) return "429 Rate Limit";
        if (msg.contains("quota")) return "Quota exceeded";
        if (msg.contains("timeout")) return "Timeout";
        if (msg.contains("400") || msg.contains("tool_use_failed")) return "400 Bad Request / Tool Format Error";
        return msg.length() > 80 ? msg.substring(0, 80) + "..." : msg;
    }

    private String formatProviderError(String providerName, Exception e) {
        String msg = e.getMessage() != null ? e.getMessage() : "";

        if (msg.contains("429") || msg.contains("rate") || msg.contains("quota")) {
            return "⏳ **" + providerName + "**: Перевищено ліміт запитів. " +
                   "Спробуйте через хвилину або переключіться на іншу модель.";
        }
        if (msg.contains("401") || msg.contains("Unauthorized") || msg.contains("invalid_api_key")) {
            return "🔑 **" + providerName + "**: Невалідний API-ключ. Перевірте конфігурацію.";
        }
        return "⚠️ **" + providerName + "** тимчасово недоступний. " +
               "Переключіться на Auto або іншу модель. Помилка: " + extractReason(e);
    }
}
