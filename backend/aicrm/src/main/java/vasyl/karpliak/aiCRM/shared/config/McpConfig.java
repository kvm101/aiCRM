package vasyl.karpliak.aiCRM.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;

import vasyl.karpliak.aiCRM.ai.tools.CommunicationsAITools;
import vasyl.karpliak.aiCRM.ai.tools.SalesAITools;
import vasyl.karpliak.aiCRM.ai.tools.SearchAITools;

@Configuration
public class McpConfig {

    @Bean
    public ToolCallbackProvider mcpTools(
            SalesAITools salesAITools,
            CommunicationsAITools communicationsAITools,
            SearchAITools searchAITools) {
        
        return MethodToolCallbackProvider.builder()
                .toolObjects(salesAITools, communicationsAITools, searchAITools)
                .build();
    }
}
