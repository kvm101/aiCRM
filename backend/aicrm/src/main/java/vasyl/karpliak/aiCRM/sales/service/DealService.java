package vasyl.karpliak.aiCRM.sales.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.dto.DealCreateRequest;
import vasyl.karpliak.aiCRM.sales.dto.DealUpdateRequest;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.dto.DealEventDto;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealEventRepository;
import vasyl.karpliak.aiCRM.sales.domain.DealEvent;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DealService {

    private final DealRepository dealRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final DealEventRepository dealEventRepository;

    public DealService(DealRepository dealRepository, ClientRepository clientRepository, UserRepository userRepository, DealEventRepository dealEventRepository) {
        this.dealRepository = dealRepository;
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.dealEventRepository = dealEventRepository;
    }

    public List<Deal> getAllDeals(Long userId) {
        return dealRepository.findByUserId(userId);
    }

    public Deal getDeal(Long userId, Long dealId) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Угоду не знайдено"));
        if (!deal.getUser().getId().equals(userId)) {
            throw new RuntimeException("Доступ заборонено");
        }
        return deal;
    }

    @Transactional
    public Deal createDeal(Long userId, DealCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new RuntimeException("Клієнта не знайдено"));

        Deal deal = new Deal();
        deal.setTitle(request.title());
        deal.setBudget(request.budget());
        deal.setCurrency(request.currency() != null ? request.currency() : "USD");
        deal.setClient(client);
        deal.setUser(user);

        Deal savedDeal = dealRepository.save(deal);
        
        logEvent(savedDeal, "CREATED", "Угоду створено.");
        return savedDeal;
    }

    @Transactional
    public Deal updateDeal(Long userId, Long dealId, DealUpdateRequest request) {
        Deal existing = getDeal(userId, dealId);
        if (request.title() != null && !request.title().isBlank()) {
            existing.setTitle(request.title());
        }
        if (request.budget() != null) {
            existing.setBudget(request.budget());
        }
        if (request.currency() != null && !request.currency().isBlank()) {
            existing.setCurrency(request.currency());
        }
        if (request.status() != null && existing.getStatus() != request.status()) {
            logEvent(existing, "STATUS_CHANGED", "Статус змінено з " + existing.getStatus() + " на " + request.status());
            existing.setStatus(request.status());
        }
        return dealRepository.save(existing);
    }

    @Transactional
    public Deal changeStatus(Long userId, Long dealId, DealStatus newStatus) {
        Deal existing = getDeal(userId, dealId);
        if (existing.getStatus() != newStatus) {
            logEvent(existing, "STATUS_CHANGED", "Статус змінено з " + existing.getStatus() + " на " + newStatus);
            existing.setStatus(newStatus);
        }
        return dealRepository.save(existing);
    }

    @Transactional
    public void deleteDeal(Long userId, Long dealId) {
        Deal existing = getDeal(userId, dealId);
        dealRepository.delete(existing);
    }

    private void logEvent(Deal deal, String eventType, String description) {
        DealEvent event = new DealEvent();
        event.setDeal(deal);
        event.setEventType(eventType);
        event.setDescription(description);
        dealEventRepository.save(event);
    }

    @Transactional
    public DealEventDto addNoteToDeal(Long userId, Long dealId, String text) {
        Deal deal = getDeal(userId, dealId);
        DealEvent event = new DealEvent();
        event.setDeal(deal);
        event.setEventType("NOTE");
        event.setDescription(text);
        DealEvent saved = dealEventRepository.save(event);
        return new DealEventDto(saved.getId(), saved.getDeal().getId(), saved.getEventType(), saved.getDescription(), saved.getCreatedAt());
    }

    public List<DealEventDto> getDealEvents(Long userId, Long dealId) {
        Deal deal = getDeal(userId, dealId); // Verify access
        return dealEventRepository.findByDealIdOrderByCreatedAtAsc(dealId)
                .stream()
                .map(e -> new DealEventDto(e.getId(), e.getDeal().getId(), e.getEventType(), e.getDescription(), e.getCreatedAt()))
                .collect(Collectors.toList());
    }
}
