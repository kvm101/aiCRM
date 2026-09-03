package vasyl.karpliak.aiCRM.sales.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
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
import vasyl.karpliak.aiCRM.sales.domain.Deal;
import vasyl.karpliak.aiCRM.sales.domain.DealEvent;
import vasyl.karpliak.aiCRM.sales.domain.Task;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealEventRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealRepository;
import vasyl.karpliak.aiCRM.sales.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {

  @Mock private TaskRepository taskRepository;
  @Mock private UserRepository userRepository;
  @Mock private DealEventRepository dealEventRepository;
  @Mock private DealRepository dealRepository;
  @Mock private ClientRepository clientRepository;
  @Mock private ProjectRepository projectRepository;

  @InjectMocks private TaskService taskService;

  private User mockUser;
  private Project mockProject;
  private Task mockTask;

  @BeforeEach
  void setUp() {
    mockProject = new Project();
    mockProject.setId(1L);

    mockUser = new User();
    mockUser.setId(10L);
    mockUser.setTasks(new ArrayList<>());

    mockTask = new Task();
    mockTask.setId(1000L);
    mockTask.setTitle("Initial Task");
    mockTask.setProject(mockProject);
  }

  @Test
  void createTask_ShouldSaveTaskAndAssociateWithUser() {
    when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
    when(projectRepository.findById(1L)).thenReturn(Optional.of(mockProject));
    when(taskRepository.save(any(Task.class))).thenReturn(mockTask);

    Task inputTask = new Task();
    inputTask.setTitle("Test Task");

    Task result = taskService.createTask(inputTask, 1L, 10L, null, null);

    assertNotNull(result);
    assertEquals(mockUser, inputTask.getUser());
    assertEquals(mockProject, inputTask.getProject());
    verify(taskRepository, times(1)).save(inputTask);
    verify(userRepository, times(1)).save(mockUser);
    assertTrue(mockUser.getTasks().contains(mockTask));
  }

  @Test
  void getTask_WhenFound_ShouldReturnTask() {
    when(taskRepository.findByIdAndProjectId(1000L, 1L)).thenReturn(Optional.of(mockTask));

    Task result = taskService.getTask(1L, 1000L);

    assertNotNull(result);
    assertEquals("Initial Task", result.getTitle());
  }

  @Test
  void updateTask_ShouldUpdateFieldsAndLogEventIfDone() {
    Deal mockDeal = new Deal();
    mockDeal.setId(500L);
    mockTask.setDeal(mockDeal);
    mockTask.setTag("TODO");

    when(taskRepository.findByIdAndProjectId(1000L, 1L)).thenReturn(Optional.of(mockTask));
    when(taskRepository.save(any(Task.class))).thenReturn(mockTask);

    Task updateReq = new Task();
    updateReq.setTag("DONE");
    updateReq.setResult("Finished writing code");

    Task result = taskService.updateTask(1L, 1000L, updateReq, null, null);

    assertEquals("DONE", result.getTag());
    assertEquals("Finished writing code", result.getResult());
    verify(taskRepository, times(1)).save(mockTask);
    verify(dealEventRepository, times(1)).save(any(DealEvent.class));
  }
}
