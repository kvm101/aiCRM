package vasyl.karpliak.aiCRM.shared.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import vasyl.karpliak.aiCRM.communications.domain.Message;
import vasyl.karpliak.aiCRM.communications.service.InboundMessageEvent;
import vasyl.karpliak.aiCRM.communications.service.NewNotificationEvent;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

  // Store active sessions
  private final Set<WebSocketSession> sessions =
      Collections.newSetFromMap(new ConcurrentHashMap<>());
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    sessions.add(session);
    System.out.println("New WebSocket connection established: " + session.getId());
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message)
      throws IOException {
    System.out.println("Received WS message: " + message.getPayload());
    session.sendMessage(new TextMessage("{\"status\":\"received\"}"));
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    sessions.remove(session);
    System.out.println("WebSocket connection closed: " + session.getId());
  }

  public void broadcast(String message) {
    for (WebSocketSession session : sessions) {
      if (session.isOpen()) {
        try {
          session.sendMessage(new TextMessage(message));
        } catch (IOException e) {
          System.err.println("Failed to send WS message: " + e.getMessage());
        }
      }
    }
  }

  @org.springframework.transaction.event.TransactionalEventListener(
      phase = org.springframework.transaction.event.TransactionPhase.AFTER_COMMIT)
  public void handleInboundMessageEvent(InboundMessageEvent event) {
    try {
      Message msg = event.getMessage();
      ObjectNode payload = objectMapper.createObjectNode();
      payload.put("id", msg.getId());
      payload.put("chatId", msg.getSession().getId());
      payload.put("senderType", msg.getSenderType().name());
      payload.put("text", msg.getText());
      if (msg.getCreatedAt() != null) {
        payload.put("createdAt", msg.getCreatedAt().toString());
      }

      ObjectNode wsEvent = objectMapper.createObjectNode();
      wsEvent.put("type", "NEW_MESSAGE");
      wsEvent.set("payload", payload);

      broadcast(objectMapper.writeValueAsString(wsEvent));
    } catch (Exception e) {
      System.err.println("Error broadcasting InboundMessageEvent: " + e.getMessage());
    }
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void handleNewNotificationEvent(NewNotificationEvent event) {
    try {
      ObjectNode payload = objectMapper.createObjectNode();
      payload.put("id", event.getNotificationId());
      payload.put("title", event.getTitle());
      payload.put("message", event.getMessage());
      payload.put("userId", event.getUserId());

      ObjectNode wsEvent = objectMapper.createObjectNode();
      wsEvent.put("type", "NEW_NOTIFICATION");
      wsEvent.set("payload", payload);

      broadcast(objectMapper.writeValueAsString(wsEvent));
    } catch (Exception e) {
      System.err.println("Error broadcasting NewNotificationEvent: " + e.getMessage());
    }
  }
}
