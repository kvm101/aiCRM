package vasyl.karpliak.aiCRM.sales.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.sales.domain.Task;
import vasyl.karpliak.aiCRM.sales.dto.TaskDTO;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;
import vasyl.karpliak.aiCRM.sales.repository.TaskRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public Task createTask(Task task, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        task.setUser(user);                 // прив’язка до користувача
        Task savedTask = taskRepository.save(task);

        user.getTasks().add(savedTask);
        userRepository.save(user);

        return savedTask;
    }

    public List<Task> getAllTasks(Long userId) {
        return taskRepository.findByUserId(userId);
    }

    public List<Task> getTasksBeforeDeadline(Long userId, LocalDateTime deadline) {
        return taskRepository.findByUserIdAndDeadlineBefore(userId, deadline);
    }

    public Task getTask(Long userId, Long taskId) {
        return taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new RuntimeException("Task not found or does not belong to user"));
    }

    public Task updateTask(Long userId, Long taskId, Task updated) {
        Task existing = getTask(userId, taskId);
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
            existing.setTag(updated.getTag());
        }
        return taskRepository.save(existing);
    }

    public void deleteTask(Long userId, Long taskId) {
        Task existing = getTask(userId, taskId);
        taskRepository.delete(existing);
    }
}
