package vasyl.karpliak.aiCRM.search.dto;

import java.util.Map;

public record SemanticSearchHitDTO(String text, Map<String, Object> metadata) {}
