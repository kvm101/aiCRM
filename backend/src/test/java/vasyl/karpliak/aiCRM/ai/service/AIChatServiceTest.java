package vasyl.karpliak.aiCRM.ai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vasyl.karpliak.aiCRM.ai.dto.ChatRequest;

@ExtendWith(MockitoExtension.class)
public class AIChatServiceTest {

  @Mock private AiOrchestrator orchestrator;

  @InjectMocks private AIChatService aiChatService;

  @Test
  void generateReply_ShouldConvertHistoryAndCallOrchestrator() {
    when(orchestrator.generateWithFallback(anyString(), anyString(), anyList(), eq("openai")))
        .thenReturn("AI Response");

    List<ChatRequest.HistoryMessage> history =
        List.of(
            new ChatRequest.HistoryMessage("user", "Hello"),
            new ChatRequest.HistoryMessage("ai", "Hi there"));

    String result = aiChatService.generateReply("How are you?", 1L, history, "openai");

    assertEquals("AI Response", result);
    verify(orchestrator, times(1))
        .generateWithFallback(anyString(), eq("How are you?"), anyList(), eq("openai"));
  }

  @Test
  void generateReply_WithNullHistory_ShouldHandleGracefully() {
    when(orchestrator.generateWithFallback(anyString(), anyString(), anyList(), eq("google")))
        .thenReturn("Google AI Response");

    String result = aiChatService.generateReply("Tell me a joke", 2L, null, "google");

    assertEquals("Google AI Response", result);
    verify(orchestrator, times(1))
        .generateWithFallback(anyString(), eq("Tell me a joke"), anyList(), eq("google"));
  }
}
