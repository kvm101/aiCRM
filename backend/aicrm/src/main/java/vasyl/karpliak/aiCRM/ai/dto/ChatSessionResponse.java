package vasyl.karpliak.aiCRM.ai.dto;

public record ChatSessionResponse(
        Long id,
        String externalChatId,
        String channelType,
        Long teamId,
        String status,
        Long assignedUserId
) {}
