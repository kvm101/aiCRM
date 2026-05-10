package vasyl.karpliak.aiCRM.search.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.web.bind.annotation.*;
import org.springframework.ai.vectorstore.VectorStore;
import vasyl.karpliak.aiCRM.search.dto.SemanticSearchRequestDTO;
import vasyl.karpliak.aiCRM.search.dto.SemanticSearchResponseDTO;
import vasyl.karpliak.aiCRM.search.service.SemanticSearchService;
import vasyl.karpliak.aiCRM.shared.context.RequestContextHelper;

@RestController
@RequestMapping("/search")
@ConditionalOnBean(VectorStore.class)
public class SemanticSearchController {

    private final SemanticSearchService semanticSearchService;

    public SemanticSearchController(SemanticSearchService semanticSearchService) {
        this.semanticSearchService = semanticSearchService;
    }

    private Long resolveProjectId(String projectIdHeader) {
        if (projectIdHeader != null && !projectIdHeader.isBlank()) {
            return Long.parseLong(projectIdHeader);
        }
        return RequestContextHelper.getCurrentProjectId();
    }

    @PostMapping("/semantic")
    public ResponseEntity<SemanticSearchResponseDTO> search(
            @RequestBody SemanticSearchRequestDTO request,
            @RequestHeader(name = "X-Project-Id", required = false) String projectIdHeader) {
        int topK = request.topK() == null ? 5 : request.topK();
        return ResponseEntity.ok(
                semanticSearchService.search(request.query(), topK, resolveProjectId(projectIdHeader))
        );
    }
}
