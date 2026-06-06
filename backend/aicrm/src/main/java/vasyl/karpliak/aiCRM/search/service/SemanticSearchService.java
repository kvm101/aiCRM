package vasyl.karpliak.aiCRM.search.service;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import vasyl.karpliak.aiCRM.search.dto.SemanticSearchHitDTO;
import vasyl.karpliak.aiCRM.search.dto.SemanticSearchResponseDTO;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SemanticSearchService {

    private final VectorStore vectorStore;

    public SemanticSearchService(org.springframework.beans.factory.ObjectProvider<VectorStore> vectorStoreProvider) {
        this.vectorStore = vectorStoreProvider.getIfAvailable();
    }

    public boolean isAvailable() {
        return this.vectorStore != null;
    }

    public SemanticSearchResponseDTO search(String query, int topK, Long projectId) {
        if (vectorStore == null) {
            throw new IllegalStateException("VectorStore is disabled or unavailable");
        }
        if (!StringUtils.hasText(query)) {
            throw new IllegalArgumentException("query is required");
        }
        int safeTopK = Math.max(1, Math.min(topK, 20));

        List<Document> rawResults = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(safeTopK)
                        .build()
        );

        List<SemanticSearchHitDTO> hits = rawResults.stream()
                .filter(doc -> belongsToProject(doc.getMetadata(), projectId))
                .map(doc -> new SemanticSearchHitDTO(doc.getText(), doc.getMetadata()))
                .collect(Collectors.toList());

        return new SemanticSearchResponseDTO(query, hits.size(), hits);
    }

    private boolean belongsToProject(Map<String, Object> metadata, Long projectId) {
        if (metadata == null) {
            return false;
        }
        Object value = metadata.get("projectId");
        if (value == null) {
            return false;
        }
        return String.valueOf(projectId).equals(String.valueOf(value));
    }
}
