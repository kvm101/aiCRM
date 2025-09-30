package vasyl.karpliak.aiCRM.services;

import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.domain.User;
import vasyl.karpliak.aiCRM.domain.client_domain.Client;
import vasyl.karpliak.aiCRM.repository.UserRepository;
import vasyl.karpliak.aiCRM.repository.client_repositories.ClientRepository;

import java.util.ArrayList;
import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public ClientService(ClientRepository clientRepository, UserRepository userRepository) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
    }

    public Client createClient(Client client, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Client savedClient = clientRepository.save(client);

        user.getClients().add(savedClient);
        userRepository.save(user);

        return savedClient;
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

    public Client getClientById(Long userId, Long clientId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getClients().stream()
                .filter(c -> c.getId().equals(clientId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Client not found: " + clientId));
    }

    public Client updateClient(Long userId, Long clientId, Client patchClient) {
        Client existing = getClientById(userId, clientId);

        if (patchClient.getName() != null && !patchClient.getName().isBlank()) {
            existing.setName(patchClient.getName());
        }
        if (patchClient.getEmail() != null && !patchClient.getEmail().isBlank()) {
            existing.setEmail(patchClient.getEmail());
        }
        if (patchClient.getPhone() != null && !patchClient.getPhone().isBlank()) {
            existing.setPhone(patchClient.getPhone());
        }
        if (patchClient.getCompany() != null && !patchClient.getCompany().isBlank()) {
            existing.setCompany(patchClient.getCompany());
        }
        if (patchClient.getStatus() != null) {
            existing.setStatus(patchClient.getStatus());
        }

        if (patchClient.getNotes() != null && !patchClient.getNotes().isEmpty()) {
            if (existing.getNotes() == null) {
                existing.setNotes(new ArrayList<>());
            }
            existing.getNotes().addAll(patchClient.getNotes());
        }

        return clientRepository.save(existing);
    }



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
