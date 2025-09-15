import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.dto.clientDTO.ClientDTO;
import vasyl.karpliak.aiCRM.services.ClientService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    // Створення нового клієнта
    @PostMapping
    public ResponseEntity<ClientDTO> createClient(@RequestBody ClientDTO clientDTO) {
        ClientDTO createdClient = clientService.createClient(clientDTO);
        return new ResponseEntity<>(createdClient, HttpStatus.CREATED);
    }

    // Отримати всіх клієнтів або фільтрованих
    @GetMapping("/filtered")
    public ResponseEntity<List<ClientDTO>> listOfClients(@RequestParam(required = false) String name) {
        List<ClientDTO> clients = clientService.getAllClients(name);
        return ResponseEntity.ok(clients);
    }

    // Отримати конкретного клієнта за id
    @GetMapping("/{id}")
    public ResponseEntity<ClientDTO> readClient(@PathVariable Long id) {
        Optional<ClientDTO> client = clientService.getClientById(id);
        return client.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Оновлення клієнта
    @PutMapping("/{id}")
    public ResponseEntity<ClientDTO> updateClient(@PathVariable Long id, @RequestBody ClientDTO clientDTO) {
        Optional<ClientDTO> updatedClient = clientService.updateClient(id, clientDTO);
        return updatedClient.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Видалення клієнта
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        boolean deleted = clientService.deleteClient(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
