package vasyl.karpliak.aiCRM.sales.dto;

import vasyl.karpliak.aiCRM.sales.enums.ClientStatus;
import java.util.List;

public record ClientDTO(
        Long id,
        String name,
        String company,
        String email,
        String phone,
        ClientStatus status,
        ProjectDTO project,
        List<ClientNoteDTO> clientNotes
) {
}
