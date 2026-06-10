package vasyl.karpliak.aiCRM.shared.config;

import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.definition.ToolDefinition;

public class ConfirmableToolCallback implements ToolCallback {

    private final ToolCallback delegate;
    private final PendingToolRegistry registry;

    public ConfirmableToolCallback(ToolCallback delegate, PendingToolRegistry registry) {
        this.delegate = delegate;
        this.registry = registry;
    }

    @Override
    public ToolDefinition getToolDefinition() {
        return delegate.getToolDefinition();
    }

    @Override
    public String call(String toolInput) {
        String toolName = delegate.getToolDefinition().name();
        System.out.println("Intercepted tool call: " + toolName + " with input: " + toolInput);
        
        // Request confirmation
        boolean approved = registry.requestConfirmation(toolName, toolInput);
        if (!approved) {
            throw new RuntimeException("Tool execution rejected by user or timed out.");
        }
        
        // If approved, execute original tool callback
        return delegate.call(toolInput);
    }
}
