package vasyl.karpliak.aiCRM.sales.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vasyl.karpliak.aiCRM.iam.domain.Project;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.repository.ProjectRepository;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;
import vasyl.karpliak.aiCRM.sales.domain.Client;
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.domain.DealEvent;
import vasyl.karpliak.aiCRM.sales.dto.DealCreateRequest;
import vasyl.karpliak.aiCRM.sales.enums.DealStatus;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealEventRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealRepository;

@ExtendWith(MockitoExtension.class)
public class DealServiceTest {

  @Mock private DealRepository dealRepository;
  @Mock private ClientRepository clientRepository;
  @Mock private UserRepository userRepository;
  @Mock private DealEventRepository dealEventRepository;
  @Mock private ProjectRepository projectRepository;

  @InjectMocks private DealService dealService;

  private Project mockProject;
  private User mockUser;
  private Client mockClient;
  private Deal mockDeal;

  @BeforeEach
  void setUp() {
    mockProject = new Project();
    mockProject.setId(1L);

    mockUser = new User();
    mockUser.setId(10L);

    mockClient = new Client();
    mockClient.setId(100L);

    mockDeal = new Deal();
    mockDeal.setId(1000L);
    mockDeal.setTitle("Test Deal");
    mockDeal.setProject(mockProject);
    mockDeal.setUser(mockUser);
    mockDeal.setClient(mockClient);
    mockDeal.setStatus(DealStatus.NEW);
  }

  @Test
  void getDeal_WhenExistsAndProjectMatches_ShouldReturnDeal() {
    when(dealRepository.findById(1000L)).thenReturn(Optional.of(mockDeal));

    Deal result = dealService.getDeal(1L, 1000L);

    assertNotNull(result);
    assertEquals(1000L, result.getId());
  }

  @Test
  void getDeal_WhenProjectDoesNotMatch_ShouldThrowException() {
    when(dealRepository.findById(1000L)).thenReturn(Optional.of(mockDeal));

    assertThrows(RuntimeException.class, () -> dealService.getDeal(99L, 1000L));
  }

  @Test
  void createDeal_ShouldSaveDealAndLogEvent() {
    DealCreateRequest request =
        new DealCreateRequest("New Deal", new BigDecimal("1000.00"), "USD", 100L);

    when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
    when(clientRepository.findById(100L)).thenReturn(Optional.of(mockClient));
    when(projectRepository.findById(1L)).thenReturn(Optional.of(mockProject));
    when(dealRepository.save(any(Deal.class)))
        .thenAnswer(
            i -> {
              Deal d = i.getArgument(0);
              d.setId(1001L);
              return d;
            });

    Deal result = dealService.createDeal(1L, 10L, request);

    assertNotNull(result);
    assertEquals(1001L, result.getId());
    assertEquals("New Deal", result.getTitle());

    verify(dealRepository, times(1)).save(any(Deal.class));
    verify(dealEventRepository, times(1)).save(any(DealEvent.class));
  }

  @Test
  void changeStatus_ShouldUpdateStatusAndLogEvent() {
    when(dealRepository.findById(1000L)).thenReturn(Optional.of(mockDeal));
    when(dealRepository.save(any(Deal.class))).thenReturn(mockDeal);

    Deal result = dealService.changeStatus(1L, 1000L, DealStatus.QUALIFICATION);

    assertEquals(DealStatus.QUALIFICATION, result.getStatus());
    verify(dealRepository, times(1)).save(mockDeal);
    verify(dealEventRepository, times(1)).save(any(DealEvent.class));
  }
}
