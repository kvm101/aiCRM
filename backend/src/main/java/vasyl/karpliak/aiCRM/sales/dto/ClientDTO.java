package vasyl.karpliak.aiCRM.sales.dto;

import java.util.List;
import vasyl.karpliak.aiCRM.sales.enums.ClientStatus;

public record ClientDTO(
    Long id,
    String name,
    String company,
    String email,
    String phone,
    ClientStatus status,
    ProjectDTO project,
    List<ClientNoteDTO> clientNotes) {}
