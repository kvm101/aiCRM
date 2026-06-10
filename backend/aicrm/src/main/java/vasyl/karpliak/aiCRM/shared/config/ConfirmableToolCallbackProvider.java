package vasyl.karpliak.aiCRM.shared.config;

import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.ToolCallbackProvider;

import java.util.Arrays;

public class ConfirmableToolCallbackProvider implements ToolCallbackProvider {

    private final ToolCallbackProvider delegate;
    private final PendingToolRegistry registry;

    public ConfirmableToolCallbackProvider(ToolCallbackProvider delegate, PendingToolRegistry registry) {
        this.delegate = delegate;
        this.registry = registry;
    }

    @Override
    public ToolCallback[] getToolCallbacks() {
        ToolCallback[] callbacks = delegate.getToolCallbacks();
        if (callbacks == null) {
            return new ToolCallback[0];
        }
        return Arrays.stream(callbacks)
                .map(callback -> new ConfirmableToolCallback(callback, registry))
                .toArray(ToolCallback[]::new);
    }
}
