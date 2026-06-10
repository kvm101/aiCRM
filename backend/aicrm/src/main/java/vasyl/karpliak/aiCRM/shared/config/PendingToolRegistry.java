package vasyl.karpliak.aiCRM.shared.config;

import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class PendingToolRegistry {

    private final ChatWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, CompletableFuture<Boolean>> pendingCalls = new ConcurrentHashMap<>();

    public PendingToolRegistry(ChatWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    public boolean requestConfirmation(String toolName, String argumentsJson) {
        String id = UUID.randomUUID().toString();
        CompletableFuture<Boolean> future = new CompletableFuture<>();
        pendingCalls.put(id, future);

        // Broadcast to frontend
        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("id", id);
            payload.put("toolName", toolName);
            payload.put("arguments", argumentsJson);

            ObjectNode event = objectMapper.createObjectNode();
            event.put("type", "PENDING_TOOL_CALL");
            event.set("payload", payload);

            webSocketHandler.broadcast(objectMapper.writeValueAsString(event));
            System.out.println("Broadcasted PENDING_TOOL_CALL: " + toolName + " with ID " + id);
        } catch (Exception e) {
            System.err.println("Failed to broadcast pending tool call: " + e.getMessage());
        }

        try {
            // Wait up to 120 seconds for user approval
            Boolean approved = future.get(120, TimeUnit.SECONDS);
            return approved != null && approved;
        } catch (Exception e) {
            System.err.println("Tool approval timed out or failed for id: " + id);
            return false;
        } finally {
            pendingCalls.remove(id);
        }
    }

    public boolean approve(String id) {
        CompletableFuture<Boolean> future = pendingCalls.get(id);
        if (future != null) {
            future.complete(true);
            return true;
        }
        return false;
    }

    public boolean reject(String id) {
        CompletableFuture<Boolean> future = pendingCalls.get(id);
        if (future != null) {
            future.complete(false);
            return true;
        }
        return false;
    }
}
