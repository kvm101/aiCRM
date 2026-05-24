package vasyl.karpliak.aiCRM;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import vasyl.karpliak.aiCRM.sales.controller.ClientController;
import vasyl.karpliak.aiCRM.sales.dto.ClientDTO;
import vasyl.karpliak.aiCRM.sales.service.ClientService;
import vasyl.karpliak.aiCRM.sales.domain.Client;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ClientController.class)
public class ClientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClientService clientService;

    @Test
    void getAllClients_ShouldReturnOk() throws Exception {
        ClientDTO dto = new ClientDTO(1L, "Test Name", "Company", "email@test.com", "123", null, null, null);
        when(clientService.getAllClients(1L, null)).thenReturn(List.of(dto));

        mockMvc.perform(get("/clients/filtered")
                .header("X-Project-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Name"));
    }

    @Test
    void createClient_ShouldReturnCreated() throws Exception {
        ClientDTO dto = new ClientDTO(1L, "New Client", "Company", "email@test.com", "123", null, null, null);
        when(clientService.createClient(any(Client.class), eq(1L))).thenReturn(dto);

        mockMvc.perform(post("/clients")
                .header("X-Project-Id", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"New Client\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Client"));
    }

    @Test
    void readClient_WhenFound_ShouldReturnOk() throws Exception {
        ClientDTO dto = new ClientDTO(10L, "Found Client", "Company", "email@test.com", "123", null, null, null);
        when(clientService.getClientById(1L, 10L)).thenReturn(dto);

        mockMvc.perform(get("/clients/10")
                .header("X-Project-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L));
    }
}

