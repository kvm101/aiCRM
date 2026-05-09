package vasyl.karpliak.aiCRM.sales.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.dto.DealCreateRequest;
import vasyl.karpliak.aiCRM.sales.dto.DealUpdateRequest;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.service.DealService;

import vasyl.karpliak.aiCRM.ai.dto.DealResponse;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/deals")
public class DealController {

    private final DealService dealService;

    public DealController(DealService dealService) {
        this.dealService = dealService;
    }

    private Long getUserId(String userIdStr) {
        return Long.parseLong(userIdStr);
    }

    private DealResponse mapToResponse(Deal d) {
        return new DealResponse(
                d.getId(),
                d.getTitle(),
                d.getBudget(),
                d.getCurrency() != null ? d.getCurrency() : "USD",
                d.getStatus() != null ? d.getStatus().name() : null,
                d.getClient() != null ? d.getClient().getId() : null,
                d.getClient() != null ? d.getClient().getName() : null,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }

    @GetMapping
    public ResponseEntity<List<DealResponse>> getAllDeals(@RequestHeader(name = "X-User-Id") String userId) {
        List<DealResponse> deals = dealService.getAllDeals(getUserId(userId))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(deals);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DealResponse> getDeal(@PathVariable Long id, @RequestHeader(name = "X-User-Id") String userId) {
        return ResponseEntity.ok(mapToResponse(dealService.getDeal(getUserId(userId), id)));
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<List<vasyl.karpliak.aiCRM.sales.dto.DealEventDto>> getDealEvents(@PathVariable Long id, @RequestHeader(name = "X-User-Id") String userId) {
        return ResponseEntity.ok(dealService.getDealEvents(getUserId(userId), id));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<vasyl.karpliak.aiCRM.sales.dto.DealEventDto> addDealNote(
            @PathVariable Long id, 
            @RequestBody java.util.Map<String, String> payload,
            @RequestHeader(name = "X-User-Id") String userId) {
        return ResponseEntity.ok(dealService.addNoteToDeal(getUserId(userId), id, payload.get("text")));
    }

    @PostMapping
    public ResponseEntity<DealResponse> createDeal(@RequestBody DealCreateRequest request, @RequestHeader(name = "X-User-Id") String userId) {
        return ResponseEntity.ok(mapToResponse(dealService.createDeal(getUserId(userId), request)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<DealResponse> updateDeal(@PathVariable Long id, @RequestBody DealUpdateRequest request, @RequestHeader(name = "X-User-Id") String userId) {
        return ResponseEntity.ok(mapToResponse(dealService.updateDeal(getUserId(userId), id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DealResponse> changeStatus(@PathVariable Long id, @RequestParam DealStatus status, @RequestHeader(name = "X-User-Id") String userId) {
        return ResponseEntity.ok(mapToResponse(dealService.changeStatus(getUserId(userId), id, status)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeal(@PathVariable Long id, @RequestHeader(name = "X-User-Id") String userId) {
        dealService.deleteDeal(getUserId(userId), id);
        return ResponseEntity.noContent().build();
    }
}
