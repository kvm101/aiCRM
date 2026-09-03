package vasyl.karpliak.aiCRM.ai.dto;

import java.util.List;

public record ChatRequest(
    String message,
    List<HistoryMessage> history,
    String modelProvider // "auto", "gemini", "deepseek", "groq"
    ) {
  public record HistoryMessage(
      String role, // "user" | "ai"
      String content) {}
}
