package vasyl.karpliak.aiCRM.ai.dto;

import java.util.List;

public record UserResponse(Long id, String name, String email, List<TaskResponse> tasks) {}
