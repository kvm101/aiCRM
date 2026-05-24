package vasyl.karpliak.aiCRM.sales.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.enums.ClientStatus;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.dto.DealCreateRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class SalesIntegrationService {

    private final ClientService clientService;
    private final DealService dealService;
    private final UserRepository userRepository;
    private final vasyl.karpliak.aiCRM.communications.repository.NotificationRepository notificationRepository;

    public SalesIntegrationService(ClientService clientService, DealService dealService, UserRepository userRepository, vasyl.karpliak.aiCRM.communications.repository.NotificationRepository notificationRepository) {
        this.clientService = clientService;
        this.dealService = dealService;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void processIncomingMessage(Long userId, String contactIdentifier, String contactName, String text) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        // Try to find client by email (which acts as our contact identifier for both email and facebook identifier)
        Optional<Client> existingClient = user.getClients().stream()
                .filter(c -> c.getEmail().equalsIgnoreCase(contactIdentifier) || c.getName().equalsIgnoreCase(contactIdentifier))
                .findFirst();

        final Long clientId;
        String finalClientName;
        if (existingClient.isPresent()) {
            Client c = existingClient.get();
            clientId = c.getId();
            finalClientName = c.getName();
        } else {
            // Create new client
            Client client = new Client();
            client.setName(contactName != null && !contactName.isBlank() ? contactName : contactIdentifier);
            client.setEmail(contactIdentifier);
            client.setPhone("");
            client.setCompany("");
            client.setStatus(ClientStatus.NEW);
            vasyl.karpliak.aiCRM.sales.dto.ClientDTO newDto = clientService.createClient(client, 1L); // Default project for incoming external messages
            clientId = newDto.id();
            finalClientName = newDto.name();
        }
        
        // Check for active deals
        List<Deal> activeDeals = dealService.getAllDeals(1L).stream()
                .filter(d -> d.getClient().getId().equals(clientId))
                .filter(d -> d.getStatus() != DealStatus.DONE && d.getStatus() != DealStatus.LOST)
                .toList();

        Deal targetDeal;
        if (activeDeals.isEmpty()) {
            // Create a new deal
            DealCreateRequest request = new DealCreateRequest(
                    "Угода з " + finalClientName,
                    BigDecimal.ZERO,
                    "USD",
                    clientId
            );
            targetDeal = dealService.createDeal(1L, userId, request);
        } else {
            targetDeal = activeDeals.get(0);
        }

        // Add the message as a note to the deal
        dealService.addNoteToDeal(1L, targetDeal.getId(), "Вхідне повідомлення: " + text);

        // Create notification
        vasyl.karpliak.aiCRM.communications.domain.Notification notification = new vasyl.karpliak.aiCRM.communications.domain.Notification();
        notification.setUser(user);
        notification.setTitle("Нове повідомлення");
        notification.setMessage("Від " + finalClientName + " по угоді '" + targetDeal.getTitle() + "'");
        notificationRepository.save(notification);
    }
}
