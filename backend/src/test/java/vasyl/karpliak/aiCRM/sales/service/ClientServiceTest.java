package vasyl.karpliak.aiCRM.sales.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vasyl.karpliak.aiCRM.iam.domain.Project;
import vasyl.karpliak.aiCRM.iam.repository.ProjectRepository;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.dto.ClientDTO;
import vasyl.karpliak.aiCRM.sales.enums.ClientStatus;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;

@ExtendWith(MockitoExtension.class)
public class ClientServiceTest {

  @Mock private ClientRepository clientRepository;

  @Mock private ProjectRepository projectRepository;

  @InjectMocks private ClientService clientService;

  private Project mockProject;
  private Client mockClient;

  @BeforeEach
  void setUp() {
    mockProject = new Project();
    mockProject.setId(1L);
    mockProject.setName("Test Project");

    mockClient = new Client();
    mockClient.setId(100L);
    mockClient.setName("Test Client");
    mockClient.setEmail("test@client.com");
    mockClient.setStatus(ClientStatus.NEW);
    mockClient.setProject(mockProject);
  }

  @Test
  void createClient_ShouldReturnClientDTO() {
    // Arrange
    when(projectRepository.findById(1L)).thenReturn(Optional.of(mockProject));
    when(clientRepository.save(any(Client.class))).thenReturn(mockClient);

    Client inputClient = new Client();
    inputClient.setName("Test Client");

    // Act
    ClientDTO result = clientService.createClient(inputClient, 1L);

    // Assert
    assertNotNull(result);
    assertEquals(100L, result.id());
    assertEquals("Test Client", result.name());
    assertEquals("Test Project", result.project().name());

    verify(projectRepository, times(1)).findById(1L);
    verify(clientRepository, times(1)).save(inputClient);
  }

  @Test
  void createClient_WithInvalidProject_ShouldThrowException() {
    // Arrange
    when(projectRepository.findById(99L)).thenReturn(Optional.empty());

    Client inputClient = new Client();
    inputClient.setName("Test Client");

    // Act & Assert
    Exception exception =
        assertThrows(
            RuntimeException.class,
            () -> {
              clientService.createClient(inputClient, 99L);
            });

    assertEquals("Project not found", exception.getMessage());
    verify(clientRepository, never()).save(any(Client.class));
  }

  @Test
  void getAllClients_ShouldReturnListOfClientDTO() {
    when(clientRepository.findByProjectId(1L)).thenReturn(java.util.List.of(mockClient));

    java.util.List<ClientDTO> result = clientService.getAllClients(1L, null);

    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals("Test Client", result.get(0).name());
  }

  @Test
  void getAllClients_WithNameFilter_ShouldReturnFilteredClients() {
    Client client2 = new Client();
    client2.setId(101L);
    client2.setName("Other Client");
    client2.setProject(mockProject);

    when(clientRepository.findByProjectId(1L)).thenReturn(java.util.List.of(mockClient, client2));

    java.util.List<ClientDTO> result = clientService.getAllClients(1L, "Test");

    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals("Test Client", result.get(0).name());
  }

  @Test
  void getClientById_ShouldReturnClientDTO() {
    when(clientRepository.findByProjectId(1L)).thenReturn(java.util.List.of(mockClient));

    ClientDTO result = clientService.getClientById(1L, 100L);

    assertNotNull(result);
    assertEquals(100L, result.id());
  }

  @Test
  void getClientById_NotFound_ShouldThrowException() {
    when(clientRepository.findByProjectId(1L)).thenReturn(java.util.List.of(mockClient));

    assertThrows(RuntimeException.class, () -> clientService.getClientById(1L, 999L));
  }

  @Test
  void updateClient_ShouldUpdateAndReturnClientDTO() {
    when(clientRepository.findByProjectId(1L)).thenReturn(java.util.List.of(mockClient));
    when(clientRepository.save(any(Client.class))).thenReturn(mockClient);

    Client patch = new Client();
    patch.setName("Updated Name");

    ClientDTO result = clientService.updateClient(100L, 1L, patch);

    assertNotNull(result);
    assertEquals("Updated Name", mockClient.getName()); // object modifies in place before save
  }

  @Test
  void deleteClient_WhenFound_ShouldDeleteAndReturnTrue() {
    when(clientRepository.findByProjectId(1L)).thenReturn(java.util.List.of(mockClient));

    boolean result = clientService.deleteClient(1L, 100L);

    assertTrue(result);
    verify(clientRepository, times(1)).delete(mockClient);
  }

  @Test
  void deleteClient_WhenNotFound_ShouldThrowException() {
    when(clientRepository.findByProjectId(1L)).thenReturn(java.util.List.of());

    assertThrows(RuntimeException.class, () -> clientService.deleteClient(1L, 100L));
    verify(clientRepository, never()).delete(any());
  }
}
