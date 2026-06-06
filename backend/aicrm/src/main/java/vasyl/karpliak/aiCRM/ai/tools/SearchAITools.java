package vasyl.karpliak.aiCRM.ai.tools;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;
import vasyl.karpliak.aiCRM.search.dto.SemanticSearchResponseDTO;
import vasyl.karpliak.aiCRM.search.service.SemanticSearchService;
import vasyl.karpliak.aiCRM.shared.context.RequestContextHelper;

@Component
public class SearchAITools {

    private static final Logger log = LoggerFactory.getLogger(SearchAITools.class);
    private final SemanticSearchService searchService;

    public SearchAITools(org.springframework.beans.factory.ObjectProvider<SemanticSearchService> searchServiceProvider) {
        this.searchService = searchServiceProvider.getIfAvailable();
    }

    @Tool(description = "Виконує семантичний пошук по базі знань (векторній базі) за текстовим запитом. Використовуй це, коли користувач просить знайти інформацію в документах, нотатках або історії.")
    public String searchKnowledgeBase(String query) {
        if (searchService == null || !searchService.isAvailable()) {
            return "Векторна база даних наразі вимкнена. Семантичний пошук недоступний.";
        }
        log.info("[AI Tool] Performing semantic search for: {}", query);
        
        // Отримуємо поточний проєкт користувача (або можна передати null для глобального пошуку)
        Long projectId = RequestContextHelper.getCurrentProjectId();
        
        SemanticSearchResponseDTO response = searchService.search(query, 5, projectId);
        
        if (response.hits().isEmpty()) {
            return "На жаль, за запитом '" + query + "' нічого не знайдено в векторній базі.";
        }
        
        StringBuilder result = new StringBuilder("Знайдено таку інформацію (в порядку релевантності):\n");
        response.hits().forEach(hit -> {
            result.append("- ").append(hit.text()).append("\n");
        });
        
        return result.toString();
    }
}
