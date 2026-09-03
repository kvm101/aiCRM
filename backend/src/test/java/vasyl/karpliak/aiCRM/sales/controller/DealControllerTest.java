package vasyl.karpliak.aiCRM.sales.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.dto.DealCreateRequest;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.service.DealService;

@WebMvcTest(DealController.class)
public class DealControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private DealService dealService;

  @Test
  void getAllDeals_ShouldReturnList() throws Exception {
    Deal deal = new Deal();
    deal.setId(10L);
    deal.setTitle("Test Deal");
    deal.setStatus(DealStatus.NEW);

    when(dealService.getAllDeals(1L)).thenReturn(List.of(deal));

    mockMvc
        .perform(get("/deals").header("X-Project-Id", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(10L))
        .andExpect(jsonPath("$[0].title").value("Test Deal"));
  }

  @Test
  void createDeal_ShouldReturnCreatedDeal() throws Exception {
    Deal deal = new Deal();
    deal.setId(10L);
    deal.setTitle("New Deal");

    when(dealService.createDeal(eq(1L), eq(100L), any(DealCreateRequest.class))).thenReturn(deal);

    mockMvc
        .perform(
            post("/deals")
                .header("X-Project-Id", "1")
                .header("X-User-Id", "100")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"New Deal\", \"clientId\": 200, \"budget\": 5000}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(10L))
        .andExpect(jsonPath("$.title").value("New Deal"));
  }

  @Test
  void getDeal_WhenFound_ShouldReturnDeal() throws Exception {
    Deal deal = new Deal();
    deal.setId(10L);
    deal.setTitle("Specific Deal");

    when(dealService.getDeal(1L, 10L)).thenReturn(deal);

    mockMvc
        .perform(get("/deals/10").header("X-Project-Id", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(10L));
  }

  @Test
  void changeStatus_ShouldUpdateAndReturn() throws Exception {
    Deal deal = new Deal();
    deal.setId(10L);
    deal.setStatus(DealStatus.QUALIFICATION);

    when(dealService.changeStatus(1L, 10L, DealStatus.QUALIFICATION)).thenReturn(deal);

    mockMvc
        .perform(
            patch("/deals/10/status").header("X-Project-Id", "1").param("status", "QUALIFICATION"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("QUALIFICATION"));
  }

  @Test
  void deleteDeal_ShouldReturnNoContent() throws Exception {
    doNothing().when(dealService).deleteDeal(1L, 10L);

    mockMvc
        .perform(delete("/deals/10").header("X-Project-Id", "1"))
        .andExpect(status().isNoContent());
  }
}
