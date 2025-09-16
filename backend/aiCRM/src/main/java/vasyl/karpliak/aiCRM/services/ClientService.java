package vasyl.karpliak.aiCRM.services;

import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.domain.User;
import vasyl.karpliak.aiCRM.domain.client_domain.Client;
import vasyl.karpliak.aiCRM.repository.UserRepository;
import vasyl.karpliak.aiCRM.repository.client_repositories.ClientRepository;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public ClientService(ClientRepository clientRepository, UserRepository userRepository) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
    }

    public Client createClient(Client client, Long user_id) {
        User user = userRepository.findById(user_id).orElseThrow(() -> new RuntimeException("User not found"));

        user.getClients().add(client);
        userRepository.save(user);

        return client;
    }
    public List<Client> getAllClients(Long userId, String name) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Client> clients = user.getClients();

        if (name != null && !name.isBlank()) {
            return clients.stream()
                    .filter(c -> c.getName().toLowerCase().contains(name.toLowerCase()))
                    .toList();
        }

        return clients;
    }

    // Отримати конкретного клієнта по id для користувача
    public Client getClientById(Long userId, Long clientId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getClients().stream()
                .filter(c -> c.getId().equals(clientId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Client not found: " + clientId));
    }

    // Оновлення клієнта конкретного користувача
    public Client updateClient(Long userId, Long clientId, Client updated) {
        Client existing = getClientById(userId, clientId);

        existing.setName(updated.getName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setCompany(updated.getCompany());
        existing.setStatus(updated.getStatus());

        if (updated.getNotes() != null) {
            existing.setNotes(updated.getNotes());
        }
        return clientRepository.save(existing);
    }

    // Видалення клієнта конкретного користувача
    public boolean deleteClient(Long userId, Long clientId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Client client = user.getClients().stream()
                .filter(c -> c.getId().equals(clientId))
                .findFirst()
                .orElse(null);

        if (client != null) {
            user.getClients().remove(client); // orphanRemoval видалить клієнта з бази
            userRepository.save(user);
            return true;
        }

        return false;
    }
}
