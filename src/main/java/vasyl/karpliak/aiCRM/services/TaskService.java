package vasyl.karpliak.aiCRM.services;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.domain.client_domain.Task;
import vasyl.karpliak.aiCRM.repository.client_repositories.TaskRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    /** Створити нове завдання */
    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    /** Отримати всі завдання */
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    /** Отримати завдання до певного дедлайну */
    public List<Task> getTasksBeforeDeadline(LocalDateTime deadline) {
        return taskRepository.findByDeadlineBefore(deadline);
    }

    /** Отримати конкретне завдання */
    public Task getTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
    }

    /** Оновити завдання */
    public Task updateTask(Long id, Task updated) {
        Task existing = getTask(id);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setDeadline(updated.getDeadline());
        return taskRepository.save(existing);
    }

    /** Видалити завдання */
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}
