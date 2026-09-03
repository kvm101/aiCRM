package vasyl.karpliak.aiCRM.ai.config;

import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Фабрика AI-моделей: Gemini (primary) -> GitHub Models -> Mistral -> Groq (fallback). Groq та
 * GitHub використовують OpenAI-сумісний протокол.
 */
@Configuration
public class AiModelConfig {

  @Value("${spring.ai.groq.api-key:}")
  private String groqApiKey;

  @Value("${spring.ai.github.api-key:}")
  private String githubApiKey;

  /**
   * Groq — OpenAI-compatible API, дуже швидкий inference. Модель:
   * llama3-groq-70b-8192-tool-use-preview — оптимізована для tool calling.
   */
  @Bean(name = "groqModel")
  public OpenAiChatModel groqModel() {
    OpenAiApi groqApi =
        OpenAiApi.builder().baseUrl("https://api.groq.com/openai").apiKey(groqApiKey).build();

    return OpenAiChatModel.builder()
        .openAiApi(groqApi)
        .defaultOptions(
            OpenAiChatOptions.builder()
                .model("llama3-groq-70b-8192-tool-use-preview")
                .temperature(0.1)
                .build())
        .build();
  }

  /** GitHub Models — OpenAI-compatible API. Модель: gpt-4o-mini */
  @Bean(name = "githubModel")
  public OpenAiChatModel githubModelsChatModel() {
    OpenAiApi githubApi =
        OpenAiApi.builder()
            .baseUrl("https://models.inference.ai.azure.com")
            .apiKey(githubApiKey)
            .build();

    return OpenAiChatModel.builder()
        .openAiApi(githubApi)
        .defaultOptions(OpenAiChatOptions.builder().model("gpt-4o-mini").temperature(0.1).build())
        .build();
  }

  /** Mistral AI — OpenAI-compatible API. Модель: mistral-small-latest */
  @Bean(name = "mistralModel")
  public OpenAiChatModel mistralModelsChatModel(
      @Value("${spring.ai.mistralai.api-key:}") String mistralApiKey) {
    OpenAiApi mistralApi =
        OpenAiApi.builder().baseUrl("https://api.mistral.ai").apiKey(mistralApiKey).build();

    return OpenAiChatModel.builder()
        .openAiApi(mistralApi)
        .defaultOptions(
            OpenAiChatOptions.builder().model("mistral-small-latest").temperature(0.1).build())
        .build();
  }
}
