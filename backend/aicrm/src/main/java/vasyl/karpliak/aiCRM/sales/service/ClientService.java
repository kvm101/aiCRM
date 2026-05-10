package vasyl.karpliak.aiCRM.sales.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vasyl.karpliak.aiCRM.iam.domain.Project;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.iam.repository.ProjectRepository;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;
import vasyl.karpliak.aiCRM.sales.dto.ClientDTO;
import vasyl.karpliak.aiCRM.sales.dto.ProjectDTO;
import vasyl.karpliak.aiCRM.sales.dto.ClientNoteDTO;

import java.util.ArrayList;
import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;

    public ClientService(ClientRepository clientRepository, ProjectRepository projectRepository) {
        this.clientRepository = clientRepository;
        this.projectRepository = projectRepository;
    }

    private ClientDTO convertToDTO(Client client) {
        ProjectDTO projectDTO = null;
        if (client.getProject() != null) {
            projectDTO = new ProjectDTO(client.getProject().getId(), client.getProject().getName());
        }

        List<ClientNoteDTO> notesDTO = new ArrayList<>();
        if (client.getNotes() != null) {
            long noteId = 1L;
            for (String note : client.getNotes()) {
                notesDTO.add(new ClientNoteDTO(noteId++, note));
            }
        }

        return new ClientDTO(
                client.getId(),
                client.getName(),
                client.getCompany(),
                client.getEmail(),
                client.getPhone(),
                client.getStatus(),
                projectDTO,
                notesDTO
        );
    }

    @Transactional
    public ClientDTO createClient(Client client, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        client.setProject(project);
        return convertToDTO(clientRepository.save(client));
    }

    @Transactional(readOnly = true)
    public List<ClientDTO> getAllClients(Long projectId, String name) {
        List<Client> clients = clientRepository.findByProjectId(projectId);

        if (name != null && !name.isBlank()) {
            clients = clients.stream()
                    .filter(c -> c.getName().toLowerCase().contains(name.toLowerCase()))
                    .toList();
        }

        return clients.stream().map(this::convertToDTO).toList();
    }

    private Client getClientEntityById(Long projectId, Long clientId) {
        return clientRepository.findByProjectId(projectId).stream()
                .filter(c -> c.getId().equals(clientId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Client not found: " + clientId));
    }

    @Transactional(readOnly = true)
    public ClientDTO getClientById(Long projectId, Long clientId) {
        return convertToDTO(getClientEntityById(projectId, clientId));
    }

    @Transactional
    public ClientDTO updateClient(Long clientId, Long projectId, Client patchClient) {
        Client existing = getClientEntityById(projectId, clientId);

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

        return convertToDTO(clientRepository.save(existing));
    }

    @Transactional
    public boolean deleteClient(Long projectId, Long clientId) {
        Client client = getClientEntityById(projectId, clientId);
        if (client != null) {
            clientRepository.delete(client);
            return true;
        }
        return false;
    }
}
