package vasyl.karpliak.aiCRM.sales.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.enums.ClientStatus;
import vasyl.karpliak.aiCRM.sales.dto.ClientDTO;
import vasyl.karpliak.aiCRM.sales.dto.DealCreateRequest;
import vasyl.karpliak.aiCRM.communications.repository.NotificationRepository;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SalesIntegrationServiceTest {

    @Mock
    private ClientService clientService;

    @Mock
    private DealService dealService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private SalesIntegrationService salesIntegrationService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setClients(Collections.emptyList());
    }

    @Test
    void processIncomingMessage_WithNewClient_ShouldCreateClientAndDeal() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        
        ClientDTO mockClientDTO = new ClientDTO(100L, "Facebook User", null, "fb_123", null, ClientStatus.NEW, null, null);
        when(clientService.createClient(any(Client.class), eq(1L))).thenReturn(mockClientDTO);
        
        when(dealService.getAllDeals(1L)).thenReturn(Collections.emptyList());
        
        Deal mockDeal = new Deal();
        mockDeal.setId(200L);
        mockDeal.setTitle("Угода з Facebook User");
        when(dealService.createDeal(eq(1L), eq(1L), any(DealCreateRequest.class))).thenReturn(mockDeal);

        // Act
        salesIntegrationService.processIncomingMessage(1L, "fb_123", "Facebook User", "Hello CRM");

        // Assert
        verify(clientService, times(1)).createClient(any(Client.class), eq(1L));
        verify(dealService, times(1)).createDeal(eq(1L), eq(1L), any(DealCreateRequest.class));
        verify(dealService, times(1)).addNoteToDeal(eq(1L), eq(200L), eq("Вхідне повідомлення: Hello CRM"));
        verify(notificationRepository, times(1)).save(any());
    }
}
