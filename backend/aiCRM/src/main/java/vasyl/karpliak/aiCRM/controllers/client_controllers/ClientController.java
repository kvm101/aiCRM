package vasyl.karpliak.aiCRM.controllers.client_controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.domain.User;
import vasyl.karpliak.aiCRM.domain.client_domain.Client;
import vasyl.karpliak.aiCRM.services.ClientService;
import vasyl.karpliak.aiCRM.services.UserService;

import javax.print.DocFlavor;
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
    public ResponseEntity<Client> createClient(
            @RequestBody Client client,
            @CookieValue(name = "user_id", required = true) String userId) {

        Client createdClient = clientService.createClient(client, Long.parseLong(userId));

        return new ResponseEntity<>(createdClient, HttpStatus.CREATED);
    }

    @GetMapping("/filtered")
    public ResponseEntity<List<Client>> listOfClients(@RequestParam(required = false) String name, @CookieValue(name = "user_id") String user_id) {
        List<Client> clients = clientService.getAllClients(Long.parseLong(user_id), name);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Client> readClient(@PathVariable Long id, @CookieValue(name = "user_id") String user_id) {
        Optional<Client> client = Optional.ofNullable(clientService.getClientById(Long.parseLong(user_id), id));
        return client.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Client> updateClient(@PathVariable Long id, @RequestBody Client client, Long user_id) {
        Optional<Client> updatedClient = Optional.ofNullable(clientService.updateClient(id, user_id, client));
        return updatedClient.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long client_id, @CookieValue(name = "user_id") String user_id) {
        if (user_id != null) {

            boolean deleted = clientService.deleteClient(Long.parseLong(user_id), client_id);
            if (deleted) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } else {
            return  ResponseEntity.notFound().build();
        }
    }
}