package vasyl.karpliak.aiCRM.services;

import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.domain.client_domain.Client;
import vasyl.karpliak.aiCRM.dto.clientDTO.ClientDTO;
import vasyl.karpliak.aiCRM.repository.client_repositories.ClientRepository;

import java.util.List;

@Service
public class ClientService {
    ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public Client createClient(Client client) {
        return clientRepository.save(client);
    }

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    public Client getClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found: " + id));
    }

    public Client updateClient(Long id, Client updated) {
        Client existing = getClientById(id);
        existing.setName(updated.getName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setCompany(updated.getCompany());
        existing.setStatus(updated.getStatus());

        existing.setNotes(updated.getNotes());
        existing.setTasks(updated.getTasks());

        return clientRepository.save(existing);
    }

    public boolean deleteClient(Long id) {
        if (clientRepository.existsById(id)) {
            clientRepository.deleteById(id);
            return true;
        } else {
            return false;
        }
    }
}
