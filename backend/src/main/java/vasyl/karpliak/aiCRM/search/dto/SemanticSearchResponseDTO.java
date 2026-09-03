package vasyl.karpliak.aiCRM.search.dto;

import java.util.List;

public record SemanticSearchResponseDTO(String query, int total, List<SemanticSearchHitDTO> hits) {}
