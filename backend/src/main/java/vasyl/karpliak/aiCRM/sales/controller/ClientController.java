package vasyl.karpliak.aiCRM.sales.controller;

import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.dto.ClientDTO;
import vasyl.karpliak.aiCRM.sales.service.ClientService;

@RestController
@RequestMapping("/clients")
public class ClientController {

  private final ClientService clientService;

  public ClientController(ClientService clientService) {
    this.clientService = clientService;
  }

  @PostMapping
  public ResponseEntity<ClientDTO> createClient(
      @RequestBody Client client, @RequestHeader(name = "X-Project-Id") String projectId) {

    ClientDTO createdClient = clientService.createClient(client, Long.parseLong(projectId));
    return new ResponseEntity<>(createdClient, HttpStatus.CREATED);
  }

  @GetMapping("/filtered")
  public ResponseEntity<List<ClientDTO>> listOfClients(
      @RequestParam(required = false) String name,
      @RequestHeader(name = "X-Project-Id", required = false) String projectId) {

    List<ClientDTO> clients = clientService.getAllClients(resolveProjectId(projectId), name);
    return ResponseEntity.ok(clients);
  }

  @GetMapping("/{id}")
  public ResponseEntity<ClientDTO> readClient(
      @PathVariable Long id,
      @RequestHeader(name = "X-Project-Id", required = false) String projectId) {

    Optional<ClientDTO> client =
        Optional.ofNullable(clientService.getClientById(resolveProjectId(projectId), id));
    return client.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
  }

  private Long resolveProjectId(String projectIdStr) {
    if (projectIdStr != null && !projectIdStr.isBlank()) {
      return Long.parseLong(projectIdStr);
    }
    return vasyl.karpliak.aiCRM.shared.context.RequestContextHelper.getCurrentProjectId();
  }

  @PatchMapping("/{id}")
  public ResponseEntity<ClientDTO> updateClient(
      @PathVariable Long id,
      @RequestBody Client patchClient,
      @RequestHeader(name = "X-Project-Id") String projectId) {

    ClientDTO updatedClient =
        clientService.updateClient(id, Long.parseLong(projectId), patchClient);
    return ResponseEntity.ok(updatedClient);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteClient(
      @PathVariable Long id, @RequestHeader(name = "X-Project-Id") String projectId) {

    if (projectId != null) {
      boolean deleted = clientService.deleteClient(Long.parseLong(projectId), id);
      return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
    return ResponseEntity.notFound().build();
  }
}
