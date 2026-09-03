package vasyl.karpliak.aiCRM.sales.controller;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vasyl.karpliak.aiCRM.ai.dto.DealResponse;
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.dto.DealCreateRequest;
import vasyl.karpliak.aiCRM.sales.dto.DealUpdateRequest;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.service.DealService;

@RestController
@RequestMapping("/deals")
public class DealController {

  private final DealService dealService;

  public DealController(DealService dealService) {
    this.dealService = dealService;
  }

  private Long getProjectId(String projectIdStr) {
    if (projectIdStr == null || projectIdStr.isBlank()) {
      throw new RuntimeException("Project ID is missing");
    }
    return Long.parseLong(projectIdStr);
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
        d.getUpdatedAt());
  }

  @GetMapping
  public ResponseEntity<List<DealResponse>> getAllDeals(
      @RequestHeader(name = "X-Project-Id", required = false) String projectId) {
    List<DealResponse> deals =
        dealService.getAllDeals(resolveProjectId(projectId)).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    return ResponseEntity.ok(deals);
  }

  @GetMapping("/{id}")
  public ResponseEntity<DealResponse> getDeal(
      @PathVariable Long id,
      @RequestHeader(name = "X-Project-Id", required = false) String projectId) {
    return ResponseEntity.ok(mapToResponse(dealService.getDeal(resolveProjectId(projectId), id)));
  }

  private Long resolveProjectId(String projectIdStr) {
    if (projectIdStr != null && !projectIdStr.isBlank()) {
      return Long.parseLong(projectIdStr);
    }
    return vasyl.karpliak.aiCRM.shared.context.RequestContextHelper.getCurrentProjectId();
  }

  @GetMapping("/{id}/events")
  public ResponseEntity<List<vasyl.karpliak.aiCRM.sales.dto.DealEventDto>> getDealEvents(
      @PathVariable Long id, @RequestHeader(name = "X-Project-Id") String projectId) {
    return ResponseEntity.ok(dealService.getDealEvents(getProjectId(projectId), id));
  }

  @PostMapping("/{id}/notes")
  public ResponseEntity<vasyl.karpliak.aiCRM.sales.dto.DealEventDto> addDealNote(
      @PathVariable Long id,
      @RequestBody java.util.Map<String, String> payload,
      @RequestHeader(name = "X-Project-Id") String projectId) {
    return ResponseEntity.ok(
        dealService.addNoteToDeal(getProjectId(projectId), id, payload.get("text")));
  }

  @PostMapping
  public ResponseEntity<DealResponse> createDeal(
      @RequestBody DealCreateRequest request,
      @RequestHeader(name = "X-Project-Id") String projectId,
      @RequestHeader(name = "X-User-Id") String userId) {
    return ResponseEntity.ok(
        mapToResponse(
            dealService.createDeal(getProjectId(projectId), Long.parseLong(userId), request)));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<DealResponse> updateDeal(
      @PathVariable Long id,
      @RequestBody DealUpdateRequest request,
      @RequestHeader(name = "X-Project-Id") String projectId) {
    return ResponseEntity.ok(
        mapToResponse(dealService.updateDeal(getProjectId(projectId), id, request)));
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<DealResponse> changeStatus(
      @PathVariable Long id,
      @RequestParam DealStatus status,
      @RequestHeader(name = "X-Project-Id") String projectId) {
    return ResponseEntity.ok(
        mapToResponse(dealService.changeStatus(getProjectId(projectId), id, status)));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteDeal(
      @PathVariable Long id, @RequestHeader(name = "X-Project-Id") String projectId) {
    dealService.deleteDeal(getProjectId(projectId), id);
    return ResponseEntity.noContent().build();
  }
}
