package vasyl.karpliak.aiCRM.ai.dto;

public record ClientResponse(
        Long id,
        String name,
        String email,
        String phone,
        String company,
        String status
) {}
