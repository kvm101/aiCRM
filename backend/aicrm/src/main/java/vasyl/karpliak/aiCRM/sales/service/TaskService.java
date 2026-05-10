package vasyl.karpliak.aiCRM.sales.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.sales.domain.Task;
import vasyl.karpliak.aiCRM.sales.dto.TaskDTO;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;
import vasyl.karpliak.aiCRM.sales.repository.TaskRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealEventRepository;
import vasyl.karpliak.aiCRM.sales.repository.DealRepository;
import vasyl.karpliak.aiCRM.sales.repository.ClientRepository;
import vasyl.karpliak.aiCRM.sales.domain.DealEvent;
import vasyl.karpliak.aiCRM.iam.repository.ProjectRepository;
import vasyl.karpliak.aiCRM.iam.domain.Project;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final DealEventRepository dealEventRepository;
    private final DealRepository dealRepository;
    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository, DealEventRepository dealEventRepository, DealRepository dealRepository, ClientRepository clientRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.dealEventRepository = dealEventRepository;
        this.dealRepository = dealRepository;
        this.clientRepository = clientRepository;
        this.projectRepository = projectRepository;
    }

    public Task createTask(Task task, Long projectId, Long userId, Long dealId, Long clientId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        task.setUser(user);                 // прив’язка до користувача
        task.setProject(project);
        
        if (dealId != null) {
            dealRepository.findById(dealId).ifPresent(task::setDeal);
        }
        if (clientId != null) {
            clientRepository.findById(clientId).ifPresent(task::setClient);
        }

        Task savedTask = taskRepository.save(task);

        user.getTasks().add(savedTask);
        userRepository.save(user);

        if (savedTask.getDeal() != null) {
            DealEvent event = new DealEvent();
            event.setDeal(savedTask.getDeal());
            event.setEventType("TASK_CREATED");
            event.setDescription("Створено нове завдання: " + savedTask.getTitle());
            dealEventRepository.save(event);
        }

        return savedTask;
    }

    public List<Task> getAllTasks(Long projectId) {
        return taskRepository.findByProjectId(projectId);
    }

    public List<Task> getTasksBeforeDeadline(Long projectId, LocalDateTime deadline) {
        return taskRepository.findByProjectIdAndDeadlineBefore(projectId, deadline);
    }

    public Task getTask(Long projectId, Long taskId) {
        return taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new RuntimeException("Task not found or does not belong to project"));
    }

    public Task updateTask(Long projectId, Long taskId, Task updated, Long dealId, Long clientId) {
        Task existing = getTask(projectId, taskId);
        
        if (dealId != null && (existing.getDeal() == null || !existing.getDeal().getId().equals(dealId))) {
            dealRepository.findById(dealId).ifPresent(existing::setDeal);
        }
        if (clientId != null && (existing.getClient() == null || !existing.getClient().getId().equals(clientId))) {
            clientRepository.findById(clientId).ifPresent(existing::setClient);
        }
        
        if (updated.getTitle() != null) {
            existing.setTitle(updated.getTitle());
        }
        if (updated.getDescription() != null) {
            existing.setDescription(updated.getDescription());
        }
        if (updated.getDeadline() != null) {
            existing.setDeadline(updated.getDeadline());
        }
        if (updated.getTag() != null) {
            String oldTag = existing.getTag();
            existing.setTag(updated.getTag());
            if ("DONE".equals(updated.getTag()) && !"DONE".equals(oldTag) && existing.getDeal() != null) {
                DealEvent event = new DealEvent();
                event.setDeal(existing.getDeal());
                event.setEventType("TASK_COMPLETED");
                event.setDescription("Завдання \"" + existing.getTitle() + "\" виконано" + (updated.getResult() != null ? ". Результат: " + updated.getResult() : ""));
                dealEventRepository.save(event);
            }
        }
        if (updated.getResult() != null) {
            existing.setResult(updated.getResult());
        }
        return taskRepository.save(existing);
    }

    public void deleteTask(Long projectId, Long taskId) {
        Task existing = getTask(projectId, taskId);
        taskRepository.delete(existing);
    }
}
