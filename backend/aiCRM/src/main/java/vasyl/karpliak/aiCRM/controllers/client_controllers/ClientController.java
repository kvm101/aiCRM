package vasyl.karpliak.aiCRM.controllers.client_controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.domain.client_domain.Client;
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
    public ResponseEntity<Client> createClient(@RequestBody Client client) {
        Client createdClient = clientService.createClient(client);
        return new ResponseEntity<>(createdClient, HttpStatus.CREATED);
    }

    // Отримати всіх клієнтів або фільтрованих
    @GetMapping("/filtered")
    public ResponseEntity<List<Client>> listOfClients(@RequestParam(required = false) String name) {
        List<Client> clients = clientService.getAllClients(name);
        return ResponseEntity.ok(clients);
    }

    // Отримати конкретного клієнта за id
    @GetMapping("/{id}")
    public ResponseEntity<Client> readClient(@PathVariable Long id) {
        Optional<Client> client = Optional.ofNullable(clientService.getClientById(id));
        return client.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Оновлення клієнта
    @PutMapping("/{id}")
    public ResponseEntity<Client> updateClient(@PathVariable Long id, @RequestBody Client client) {
        Optional<Client> updatedClient = Optional.ofNullable(clientService.updateClient(id, client));
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
