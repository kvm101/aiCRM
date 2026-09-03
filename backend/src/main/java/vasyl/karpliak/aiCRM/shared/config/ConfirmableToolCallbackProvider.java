package vasyl.karpliak.aiCRM.shared.config;

import java.util.Arrays;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.ToolCallbackProvider;

public class ConfirmableToolCallbackProvider implements ToolCallbackProvider {

  private final ToolCallbackProvider delegate;
  private final PendingToolRegistry registry;

  public ConfirmableToolCallbackProvider(
      ToolCallbackProvider delegate, PendingToolRegistry registry) {
    this.delegate = delegate;
    this.registry = registry;
  }

  @Override
  public ToolCallback[] getToolCallbacks() {
    ToolCallback[] callbacks = delegate.getToolCallbacks();
    return Arrays.stream(callbacks)
        .map(callback -> new ConfirmableToolCallback(callback, registry))
        .toArray(ToolCallback[]::new);
  }
}
